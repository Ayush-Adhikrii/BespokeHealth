const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { logActivity } = require('../utils/activityLogger');

const setDoctorAvailability = async (req, res) => {
  const { availabilities } = req.body;
  console.log("Set doctor availability hit:", req.body);

  if (
    !req.user ||
    req.user.role !== "Doctor" ||
    !req.user.doctorProfile ||
    !req.user.doctorProfile.id
  ) {
    return res.status(403).json({ error: "Only doctors can set availability" });
  }

  const doctorId = req.user.doctorProfile.id;

  try {
    if (!Array.isArray(availabilities) || availabilities.length === 0) {
      return res.status(400).json({ error: "Invalid availability format" });
    }

    for (const slot of availabilities) {
      if (
        !slot.day_of_week ||
        slot.day_of_week < 1 ||
        slot.day_of_week > 7 ||
        !slot.start_time ||
        !slot.end_time ||
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.start_time) ||
        !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(slot.end_time)
      ) {
        return res.status(400).json({
          error:
            "Each availability must have valid day_of_week (1-7), start_time, and end_time in HH:mm format",
        });
      }

      const [startHour, startMinute] = slot.start_time.split(":").map(Number);
      const [endHour, endMinute] = slot.end_time.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      let endMinutes = endHour * 60 + endMinute;
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60;
      }
      if (endMinutes <= startMinutes) {
        return res.status(400).json({
          error: "end_time must be after start_time",
        });
      }
    }

    const timezoneOffsetMinutes = 5 * 60 + 45;

    const result = await prisma.$transaction(async (tx) => {

      await tx.doctorAvailability.deleteMany({
        where: {
          doctor_id: doctorId,
        },
      });

      await tx.timeSlot.deleteMany({
        where: {
          doctor_id: doctorId,
          appointments: { none: {} },
        },
      });

      const createdAvailabilities = [];
      for (const slot of availabilities) {
        const [startHour, startMinute] = slot.start_time.split(":").map(Number);
        const [endHour, endMinute] = slot.end_time.split(":").map(Number);

        const refDate = new Date(1970, 0, 1);
        const startTimeLocal = new Date(refDate);
        startTimeLocal.setHours(startHour, startMinute, 0, 0);

        const endTimeLocal = new Date(refDate);
        endTimeLocal.setHours(endHour, endMinute, 0, 0);

        const startTimeUTC = new Date(
          startTimeLocal.getTime() - timezoneOffsetMinutes * 60 * 1000
        );
        const endTimeUTC = new Date(
          endTimeLocal.getTime() - timezoneOffsetMinutes * 60 * 1000
        );

        console.log(
          `Setting availability: day ${slot.day_of_week}, ${startHour}:${startMinute} to ${endHour}:${endMinute}`
        );
        console.log(
          `UTC times: ${startTimeUTC.toISOString()} to ${endTimeUTC.toISOString()}`
        );

        const availability = await tx.doctorAvailability.create({
          data: {
            doctor_id: doctorId,
            day_of_week: slot.day_of_week,
            start_time: startTimeUTC,
            end_time: endTimeUTC,
            is_recurring: true,
          },
        });
        createdAvailabilities.push(availability);
      }

      await generateTimeSlotsForDoctor(tx, doctorId, 30);

      console.log("Generated time slots for doctor:", createdAvailabilities);

      return createdAvailabilities;
    });

    res.status(201).json({
      message: "Availability set successfully",
      availabilities: result,
    });
    await logActivity(req.user.id, 'set_availability', `Doctor set availability schedule. Availabilities count: ${result.length}`);
  } catch (error) {
    console.error("Set doctor availability error:", error);
    res.status(500).json({ error: "Failed to set availability" });
  }
};

const setConsultationFees = async (req, res) => {
  const { fees } = req.body;

  if (
    !req.user ||
    req.user.role !== "Doctor" ||
    !req.user.doctorProfile ||
    !req.user.doctorProfile.id
  ) {
    return res
      .status(403)
      .json({ error: "Only doctors can set consultation fees" });
  }

  const doctorId = req.user.doctorProfile.id;

  try {
    if (!Array.isArray(fees) || fees.length === 0) {
      return res.status(400).json({ error: "Invalid fees format" });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.consultationFee.deleteMany({
        where: {
          doctor_id: doctorId,
        },
      });

      const createdFees = [];
      for (const fee of fees) {
        if (!fee.consultation_type || !fee.amount) {
          return res.status(400).json({
            error: "Each fee must have consultation_type and amount",
          });
        }

        const consultationFee = await tx.consultationFee.create({
          data: {
            doctor_id: doctorId,
            consultation_type: fee.consultation_type,
            amount: fee.amount,
            currency: fee.currency || "NPR",
          },
        });
        createdFees.push(consultationFee);
      }

      return createdFees;
    });

    res.status(201).json({
      message: "Consultation fees set successfully",
      fees: result,
    });
    await logActivity(req.user.id, 'set_consultation_fees', `Doctor set consultation fees. Fees count: ${result.length}`);
  } catch (error) {
    console.error("Set consultation fees error:", error);
    res.status(500).json({ error: "Failed to set consultation fees" });
  }
};

const getGeneralStats = async (req, res) => {
  try {
    if (
      !req.user ||
      req.user.role !== "Doctor" ||
      !req.user.doctorProfile ||
      !req.user.doctorProfile.id
    ) {
      return res
        .status(403)
        .json({ error: "Only doctors can access this endpoint" });
    }

    const doctorID = req.user.doctorProfile.id;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfPrevMonth = new Date(firstDayOfMonth);
    lastDayOfPrevMonth.setDate(lastDayOfPrevMonth.getDate() - 1);
    const firstDayOfPrevMonth = new Date(
      lastDayOfPrevMonth.getFullYear(),
      lastDayOfPrevMonth.getMonth(),
      1
    );

    const totalPatients = await prisma.appointment.findMany({
      where: { doctor_id: doctorID },
      select: { patient_id: true },
      distinct: ["patient_id"],
    });

    const newPatientsThisMonth = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorID,
        created_at: { gte: firstDayOfMonth },
      },
      select: { patient_id: true },
      distinct: ["patient_id"],
    });

    const appointmentStats = await prisma.appointment.groupBy({
      by: ["status"],
      where: { doctor_id: doctorID },
      _count: { id: true },
    });

    const upcomingAppointments = await prisma.appointment.count({
      where: {
        doctor_id: doctorID,
        status: "confirmed",
        time_slot: {
          date: { gte: today },
        },
      },
    });

    const currentMonthRevenue = await prisma.payment.aggregate({
      where: {
        appointment: {
          doctor_id: doctorID,
          created_at: {
            gte: firstDayOfMonth,
            lte: today,
          },
        },
        status: "completed",
      },
      _sum: { amount: true },
    });

    const previousMonthRevenue = await prisma.payment.aggregate({
      where: {
        appointment: {
          doctor_id: doctorID,
          created_at: {
            gte: firstDayOfPrevMonth,
            lte: lastDayOfPrevMonth,
          },
        },
        status: "completed",
      },
      _sum: { amount: true },
    });

    const appointmentCounts = {};
    appointmentStats.forEach((stat) => {
      appointmentCounts[stat.status] = stat._count.id;
    });

    const prevRevenue = previousMonthRevenue._sum.amount || 0;
    const currRevenue = currentMonthRevenue._sum.amount || 0;
    const revenueGrowth =
      prevRevenue > 0
        ? Number((((currRevenue - prevRevenue) / prevRevenue) * 100).toFixed(2))
        : 100;

    res.status(200).json({
      patients: {
        total: totalPatients.length,
        newThisMonth: newPatientsThisMonth.length,
        percentNewThisMonth:
          totalPatients.length > 0
            ? Number(
                (
                  (newPatientsThisMonth.length / totalPatients.length) *
                  100
                ).toFixed(2)
              )
            : 0,
      },
      appointments: {
        upcoming: upcomingAppointments,
        completed: appointmentCounts.completed || 0,
        cancelled: appointmentCounts.cancelled || 0,
        pending: appointmentCounts.pending || 0,
        total: Object.values(appointmentCounts).reduce(
          (sum, count) => sum + count,
          0
        ),
      },
      revenue: {
        currentMonth: currRevenue,
        previousMonth: prevRevenue,
        growth: revenueGrowth,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

const getDoctorAvailability = async (req, res) => {
  console.log("Get doctor availability hit");
  const doctorId = parseInt(req.params.doctorId);

  try {
    const availabilities = await prisma.doctorAvailability.findMany({
      where: {
        doctor_id: doctorId,
        is_recurring: true,
      },
      orderBy: {
        day_of_week: "asc",
      },
    });

    const timezoneOffsetMinutes = 5 * 60 + 45;
    const formattedAvailabilities = availabilities.map((slot) => {
      const startTimeLocal = new Date(
        slot.start_time.getTime() + timezoneOffsetMinutes * 60 * 1000
      );
      const endTimeLocal = new Date(
        slot.end_time.getTime() + timezoneOffsetMinutes * 60 * 1000
      );
      const startHour = startTimeLocal.getHours().toString().padStart(2, "0");
      const startMinute = startTimeLocal.getMinutes().toString().padStart(2, "0");
      const endHour = endTimeLocal.getHours().toString().padStart(2, "0");
      const endMinute = endTimeLocal.getMinutes().toString().padStart(2, "0");

      return {
        id: slot.id,
        day_of_week: slot.day_of_week,
        start_time: `${startHour}:${startMinute}`,
        end_time: `${endHour}:${endMinute}`,
      };
    });

    res.status(200).json(formattedAvailabilities);
  } catch (error) {
    console.error("Get doctor availability error:", error);
    res.status(500).json({ error: "Failed to retrieve availability" });
  }
};

const getConsultationFees = async (req, res) => {
  const doctorId = parseInt(req.params.doctorId);

  try {
    const fees = await prisma.consultationFee.findMany({
      where: {
        doctor_id: doctorId,
      },
    });

    res.status(200).json(fees);
  } catch (error) {
    console.error("Get consultation fees error:", error);
    res.status(500).json({ error: "Failed to retrieve consultation fees" });
  }
};

const getOwnAvailability = async (req, res) => {
  console.log("Get own availability hit");

  if (
    !req.user ||
    req.user.role !== "Doctor" ||
    !req.user.doctorProfile ||
    !req.user.doctorProfile.id
  ) {
    return res
      .status(403)
      .json({ error: "Only doctors can access this endpoint" });
  }

  const doctorId = req.user.doctorProfile.id;

  try {
    const availabilities = await prisma.doctorAvailability.findMany({
      where: {
        doctor_id: doctorId,
        is_recurring: true,
      },
      orderBy: {
        day_of_week: "asc",
      },
    });

    const timezoneOffsetMinutes = 5 * 60 + 45;
    const formattedAvailabilities = availabilities.map((slot) => {
      const startTimeLocal = new Date(
        slot.start_time.getTime() + timezoneOffsetMinutes * 60 * 1000
      );
      const endTimeLocal = new Date(
        slot.end_time.getTime() + timezoneOffsetMinutes * 60 * 1000
      );
      const startHour = startTimeLocal.getHours().toString().padStart(2, "0");
      const startMinute = startTimeLocal.getMinutes().toString().padStart(2, "0");
      const endHour = endTimeLocal.getHours().toString().padStart(2, "0");
      const endMinute = endTimeLocal.getMinutes().toString().padStart(2, "0");

      return {
        id: slot.id,
        day_of_week: slot.day_of_week,
        start_time: `${startHour}:${startMinute}`,
        end_time: `${endHour}:${endMinute}`,
      };
    });

    res.status(200).json(formattedAvailabilities);
  } catch (error) {
    console.error("Get own availability error:", error);
    res.status(500).json({ error: "Failed to retrieve availability" });
  }
};

const getOwnConsultationFees = async (req, res) => {
  if (
    !req.user ||
    req.user.role !== "Doctor" ||
    !req.user.doctorProfile ||
    !req.user.doctorProfile.id
  ) {
    return res
      .status(403)
      .json({ error: "Only doctors can access this endpoint" });
  }

  const doctorId = req.user.doctorProfile.id;

  try {
    const fees = await prisma.consultationFee.findMany({
      where: {
        doctor_id: doctorId,
      },
    });

    res.status(200).json(fees);
  } catch (error) {
    console.error("Get own consultation fees error:", error);
    res.status(500).json({ error: "Failed to retrieve consultation fees" });
  }
};

const generateTimeSlotsForDoctor = async (
  prismaClient,
  doctorId,
  daysAhead
) => {

  const availabilities = await prismaClient.doctorAvailability.findMany({
    where: {
      doctor_id: doctorId,
      is_recurring: true,
    },
  });

  if (availabilities.length === 0) {
    return [];
  }

  const doctor = await prismaClient.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const slotDurationMinutes = 30;
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timezoneOffsetMinutes = 5 * 60 + 45;

  console.log(
    "Processing availabilities:",
    JSON.stringify(availabilities, null, 2)
  );

  const availabilitiesByDay = {};
  availabilities.forEach((avail) => {
    if (!availabilitiesByDay[avail.day_of_week]) {
      availabilitiesByDay[avail.day_of_week] = [];
    }
    availabilitiesByDay[avail.day_of_week].push(avail);
  });

  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    let jsDay = date.getDay();
    let dayOfWeek = jsDay === 0 ? 7 : jsDay;

    console.log(
      `Processing date ${date.toISOString().split("T")[0]}, day of week: ${dayOfWeek}`
    );

    const dayAvailabilities = availabilitiesByDay[dayOfWeek] || [];
    if (dayAvailabilities.length === 0) continue;

    for (const availability of dayAvailabilities) {
      console.log(`Processing availability: ${JSON.stringify(availability)}`);

      const startTimeUTC = new Date(availability.start_time);
      const endTimeUTC = new Date(availability.end_time);

      const slotDateUTC = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0, 0, 0
      ));

      const startDateTimeUTC = new Date(slotDateUTC);
      startDateTimeUTC.setUTCHours(
        startTimeUTC.getUTCHours(),
        startTimeUTC.getUTCMinutes(),
        0, 0
      );

      const endDateTimeUTC = new Date(slotDateUTC);
      endDateTimeUTC.setUTCHours(
        endTimeUTC.getUTCHours(),
        endTimeUTC.getUTCMinutes(),
        0, 0
      );

      if (endDateTimeUTC <= startDateTimeUTC) {
        endDateTimeUTC.setUTCDate(endDateTimeUTC.getUTCDate() + 1);
      }

      console.log(
        `Slot times (UTC): ${startDateTimeUTC.toISOString()} to ${endDateTimeUTC.toISOString()}`
      );

      let currentSlotUTC = new Date(startDateTimeUTC);
      if (i === 0) {
        const now = new Date();

        const nowUTC = new Date(now.getTime() - timezoneOffsetMinutes * 60 * 1000);
        if (nowUTC > startDateTimeUTC) {

          const minutesSinceStart = (nowUTC.getTime() - startDateTimeUTC.getTime()) / (60 * 1000);
          const slotsPassed = Math.ceil(minutesSinceStart / slotDurationMinutes);
          currentSlotUTC.setUTCMinutes(startTimeUTC.getUTCMinutes() + slotsPassed * slotDurationMinutes);
        }
      }

      while (currentSlotUTC < endDateTimeUTC) {
        const slotEndUTC = new Date(currentSlotUTC);
        slotEndUTC.setUTCMinutes(slotEndUTC.getUTCMinutes() + slotDurationMinutes);

        if (slotEndUTC > endDateTimeUTC) {
          break;
        }

        const startNPT = new Date(currentSlotUTC.getTime() + timezoneOffsetMinutes * 60 * 1000);
        const endNPT = new Date(slotEndUTC.getTime() + timezoneOffsetMinutes * 60 * 1000);
        const formattedStart = startNPT.toTimeString().substring(0, 5);
        const formattedEnd = endNPT.toTimeString().substring(0, 5);

        console.log(`Creating slot (NPT): ${formattedStart} to ${formattedEnd}`);

        slots.push({
          doctor_id: doctorId,
          date: new Date(slotDateUTC),
          start_time: new Date(currentSlotUTC),
          end_time: new Date(slotEndUTC),
          duration_minutes: slotDurationMinutes,
          is_available: true,
        });

        currentSlotUTC.setUTCMinutes(currentSlotUTC.getUTCMinutes() + slotDurationMinutes);
      }
    }
  }

  console.log(`Generated ${slots.length} time slots`);

  if (slots.length > 0) {

    const uniqueSlots = [];
    const seen = new Set();
    for (const slot of slots) {
      const key = `${slot.doctor_id}-${slot.date.toISOString()}-${slot.start_time.toISOString()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSlots.push(slot);
      }
    }

    await prismaClient.timeSlot.createMany({
      data: uniqueSlots,
      skipDuplicates: true,
    });
  }

  return slots;
};

const getTimeSlotsForDoctor = async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    const date = req.query.date ? new Date(req.query.date) : new Date();

    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const formattedDate = date.toISOString().split("T")[0];

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        user: { select: { name: true } },
        speciality: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        doctor_id: doctorId,
        date: {
          equals: new Date(formattedDate),
        },
        is_available: true,
      },
      orderBy: {
        start_time: "asc",
      },
    });

    const timezoneOffsetMinutes = 5 * 60 + 45;

    const formattedTimeSlots = timeSlots.map((slot) => {

      const startTimeLocal = new Date(
        slot.start_time.getTime() + timezoneOffsetMinutes * 60 * 1000
      );
      const endTimeLocal = new Date(
        slot.end_time.getTime() + timezoneOffsetMinutes * 60 * 1000
      );

      const startHour = startTimeLocal.getHours().toString().padStart(2, "0");
      const startMinute = startTimeLocal.getMinutes().toString().padStart(2, "0");
      const endHour = endTimeLocal.getHours().toString().padStart(2, "0");
      const endMinute = endTimeLocal.getMinutes().toString().padStart(2, "0");

      return {
        id: slot.id,
        date: slot.date.toISOString().split("T")[0],
        start_time: `${startHour}:${startMinute}`,
        end_time: `${endHour}:${endMinute}`,
        duration_minutes: slot.duration_minutes,
      };
    });

    res.status(200).json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        speciality: doctor.speciality,
      },
      time_slots: formattedTimeSlots,
    });
  } catch (error) {
    console.error("Get time slots error:", error);
    res.status(500).json({ error: "Failed to retrieve time slots" });
  }
};

module.exports = {
  setDoctorAvailability,
  getDoctorAvailability,
  getOwnAvailability,
  setConsultationFees,
  getConsultationFees,
  getOwnConsultationFees,
  generateTimeSlotsForDoctor,
  getGeneralStats,
  getTimeSlotsForDoctor,
};