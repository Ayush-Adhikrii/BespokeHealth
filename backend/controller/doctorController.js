const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_DOCTOR_IMAGE = "uploads/doctors/doctor.png";

const buildImageUrl = (req, image_url) =>
  `${req.protocol}://${req.get("host")}/api/${image_url || DEFAULT_DOCTOR_IMAGE}`;

const getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || "name";
    const sortOrder =
      req.query.sortOrder?.toLowerCase() === "desc" ? "desc" : "asc";

    const speciality = req.query.speciality;
    const minExperience = req.query.minExperience
      ? parseInt(req.query.minExperience)
      : undefined;

    const searchTerm = req.query.search;

    let whereClause = {
      is_active: true,
    };

    if (speciality) {
      whereClause.speciality = speciality;
    }

    if (minExperience) {
      whereClause.years_of_experience = {
        gte: minExperience,
      };
    }

    if (searchTerm) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          speciality: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          educational_qualification: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
        {
          former_organisation: {
            contains: searchTerm,
            mode: "insensitive",
          },
        },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultation_fees: true,
      },
      orderBy:
        sortBy === "name"
          ? { user: { name: sortOrder } }
          : { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user.name,
      speciality: doctor.speciality,
      educational_qualification: doctor.educational_qualification,
      years_of_experience: doctor.years_of_experience,
      former_organisation: doctor.former_organisation || null,
      image_url: buildImageUrl(req, doctor.image_url),
      avg_rating: doctor.avg_rating,
      rating_count: doctor.rating_count,
      consultation_fees: doctor.consultation_fees,
    }));

    const totalCount = await prisma.doctor.count({
      where: whereClause,
    });

    return res.status(200).json({
      doctors: formattedDoctors,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Get all doctors error:", error);
    return res.status(500).json({ error: "Failed to retrieve doctors" });
  }
};

const getDoctorById = async (req, res) => {
  const { doctorId } = req.params;

  try {

    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const doctorIdInt = parseInt(doctorId);

    if (isNaN(doctorIdInt)) {
      return res.status(400).json({ error: "Invalid doctor ID format" });
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorIdInt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultation_fees: true,
        availabilities: {
          where: {
            is_recurring: true,
          },
          orderBy: {
            day_of_week: "asc",
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    doctor.image_url = buildImageUrl(req, doctor.image_url);

    res.status(200).json(doctor);
  } catch (error) {
    console.error("Get doctor by ID error:", error);
    res.status(500).json({ error: "Failed to retrieve doctor" });
  }
};

const getDoctorsBySpeciality = async (req, res) => {
  const { speciality } = req.params;

  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        speciality,
        is_active: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultation_fees: true,
      },
    });

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user.name,
      speciality: doctor.speciality,
      educational_qualification: doctor.educational_qualification,
      years_of_experience: doctor.years_of_experience,
      former_organisation: doctor.former_organisation || null,
      image_url: buildImageUrl(req, doctor.image_url),
      consultation_fees: doctor.consultation_fees,
    }));

    return res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error("Get doctors by speciality error:", error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve doctors by speciality" });
  }
};

const getAllSpecialities = async (req, res) => {
  try {
    const specialities = await prisma.doctor.findMany({
      where: {
        is_active: true,
      },
      select: {
        speciality: true,
      },
      distinct: ["speciality"],
    });

    const specialityList = specialities.map((item) => item.speciality);

    return res.status(200).json(specialityList);
  } catch (error) {
    console.error("Get all specialities error:", error);
    return res.status(500).json({ error: "Failed to retrieve specialities" });
  }
};

const getDoctorsByFeeRange = async (req, res) => {
  try {
    const minFee = req.query.minFee ? parseFloat(req.query.minFee) : undefined;
    const maxFee = req.query.maxFee ? parseFloat(req.query.maxFee) : undefined;
    const consultationType = req.query.type || "first_visit";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let feeFilter = {};

    if (minFee !== undefined) {
      feeFilter.gte = minFee;
    }

    if (maxFee !== undefined) {
      feeFilter.lte = maxFee;
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        is_active: true,
        consultation_fees: {
          some: {
            consultation_type: consultationType,
            amount: Object.keys(feeFilter).length > 0 ? feeFilter : undefined,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        consultation_fees: true,
      },
      skip,
      take: limit,
    });

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      userId: doctor.userId,
      name: doctor.user.name,
      speciality: doctor.speciality,
      educational_qualification: doctor.educational_qualification,
      years_of_experience: doctor.years_of_experience,
      former_organisation: doctor.former_organisation || null,
      image_url: buildImageUrl(req, doctor.image_url),
      consultation_fees: doctor.consultation_fees,
    }));

    const totalCount = await prisma.doctor.count({
      where: {
        is_active: true,
        consultation_fees: {
          some: {
            consultation_type: consultationType,
            amount: Object.keys(feeFilter).length > 0 ? feeFilter : undefined,
          },
        },
      },
    });

    return res.status(200).json({
      doctors: formattedDoctors,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error("Get doctors by fee range error:", error);
    return res
      .status(500)
      .json({ error: "Failed to retrieve doctors by fee range" });
  }
};

const getDoctorPatients = async (req, res) => {
  try {

    if (req.user.role !== "Doctor") {
      return res
        .status(403)
        .json({ error: "Only doctors can access this endpoint" });
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        userId: req.user.id,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const doctorId = doctor.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let whereClause = {
      doctor_id: doctorId,
    };

    if (search) {
      whereClause.patient = {
        user: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      distinct: ["patient_id"],
      skip,
      take: limit,
    });

    const totalPatients = await prisma.appointment.findMany({
      where: { doctor_id: doctorId },
      distinct: ["patient_id"],
      select: { patient_id: true },
    });

    const patients = appointments.map((appointment) => ({
      id: appointment.patient.id,
      name: appointment.patient.user.name,
      email: appointment.patient.user.email,
      gender: appointment.patient.gender || "Not specified",
      last_visit: appointment.created_at,
      appointment_id: appointment.id,
    }));

    res.status(200).json({
      patients,
      currentPage: page,
      totalPages: Math.ceil(totalPatients.length / limit),
      totalCount: totalPatients.length,
    });
  } catch (error) {
    console.error("Get doctor's patients error:", error);
    res.status(500).json({ error: "Failed to retrieve patients" });
  }
};

const getPatientDetails = async (req, res) => {
  const doctorId = req.user.doctorProfile.id;
  const { patientId } = req.params;

  try {

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        doctor_id: doctorId,
        patient_id: parseInt(patientId),
      },
    });

    if (!hasAppointment) {
      return res.status(403).json({
        error: "You are not authorized to view this patient's details",
      });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            created_at: true,
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        patient_id: parseInt(patientId),
      },
      include: {
        time_slot: true,
        payment: true,
      },
      orderBy: {
        time_slot: {
          date: "desc",
        },
      },
    });

    const appointmentHistory = appointments.map((appointment) => ({
      id: appointment.id,
      date: appointment.time_slot.date.toISOString().split("T")[0],
      start_time: appointment.time_slot.start_time
        .toISOString()
        .substring(11, 16),
      end_time: appointment.time_slot.end_time.toISOString().substring(11, 16),
      status: appointment.status,
      payment_status: appointment.payment?.status || "pending",
      amount: appointment.payment?.amount,
      symptoms: appointment.symptoms,
      notes: appointment.notes,
      created_at: appointment.created_at,
    }));

    const patientDetails = {
      id: patient.id,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.phone_number,
      gender: patient.gender,
      date_of_birth: patient.date_of_birth,
      member_since: patient.user.created_at,
      appointment_count: appointments.length,
      last_appointment: appointments.length > 0 ? appointmentHistory[0] : null,
      appointment_history: appointmentHistory,
    };

    res.status(200).json(patientDetails);
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({ error: "Failed to retrieve patient details" });
  }
};

const getGeneralStats = async (req, res) => {
  try {
    console.log("getGeneralStats - Request user:", req.user);
    console.log("getGeneralStats - User role:", req.user?.role);
    console.log("getGeneralStats - Doctor profile:", req.user?.doctorProfile);

    if (
      !req.user ||
      req.user.role !== "Doctor" ||
      !req.user.doctorProfile ||
      !req.user.doctorProfile.id
    ) {
      console.log("getGeneralStats - Access denied - Missing user or doctor profile");
      return res
        .status(403)
        .json({ error: "Only doctors can access this endpoint" });
    }

    const doctorID = req.user.doctorProfile.id;
    console.log("getGeneralStats - Doctor ID:", doctorID);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfPrevMonth = new Date(firstDayOfMonth);
    lastDayOfPrevMonth.setDate(lastDayOfPrevMonth.getDate() - 1);
    const firstDayOfPrevMonth = new Date(
      lastDayOfPrevMonth.getFullYear(),
      lastDayOfPrevMonth.getMonth(),
      1
    );

    console.log("getGeneralStats - Date ranges:", {
      today: today.toISOString(),
      firstDayOfMonth: firstDayOfMonth.toISOString(),
      firstDayOfPrevMonth: firstDayOfPrevMonth.toISOString()
    });

    console.log("getGeneralStats - Fetching total patients...");
    const totalPatients = await prisma.appointment.findMany({
      where: { doctor_id: doctorID },
      select: { patient_id: true },
      distinct: ["patient_id"],
    });
    console.log("getGeneralStats - Total patients found:", totalPatients.length);

    console.log("getGeneralStats - Fetching new patients this month...");
    const newPatientsThisMonth = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorID,
        created_at: { gte: firstDayOfMonth },
      },
      select: { patient_id: true },
      distinct: ["patient_id"],
    });
    console.log("getGeneralStats - New patients this month:", newPatientsThisMonth.length);

    console.log("getGeneralStats - Fetching appointment stats...");
    const appointmentStats = await prisma.appointment.groupBy({
      by: ["status"],
      where: { doctor_id: doctorID },
      _count: { id: true },
    });
    console.log("getGeneralStats - Appointment stats:", appointmentStats);

    console.log("getGeneralStats - Fetching upcoming appointments...");
    const upcomingAppointments = await prisma.appointment.count({
      where: {
        doctor_id: doctorID,
        status: "confirmed",
        time_slot: {
          date: { gte: today },
        },
      },
    });
    console.log("getGeneralStats - Upcoming appointments:", upcomingAppointments);

    console.log("getGeneralStats - Fetching current month revenue...");
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
    console.log("getGeneralStats - Current month revenue:", currentMonthRevenue);

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
    console.log("getGeneralStats - Previous month revenue:", previousMonthRevenue);

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

    const response = {
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
    };

    console.log("getGeneralStats - Final response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
};

const trial = async (req, res) => {
  console.log("Trial API hit");

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

    const formattedAvailabilities = availabilities.map((slot) => ({
      id: slot.id,
      day_of_week: slot.day_of_week,

      start_time: slot.start_time.toISOString().substring(11, 16),
      end_time: slot.end_time.toISOString().substring(11, 16),
    }));

    res.status(200).json(formattedAvailabilities);
  } catch (error) {
    console.error("Get own availability error:", error);
    res.status(500).json({ error: "Failed to retrieve availability" });
  }
};

const getAppointmentAnalytics = async (req, res) => {
  try {
    const doctorId = req.user.doctorProfile.id;
    const today = new Date();

    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        time_slot: {
          date: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      },
      include: {
        patient: {
          include: { user: { select: { name: true } } }
        },
        time_slot: true
      },
      orderBy: {
        time_slot: { start_time: "asc" }
      }
    });

    const weekAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        time_slot: {
          date: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
      },
      include: {
        time_slot: true,
      },
    });

    const recentAppointments = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        status: "completed",
      },
      include: {
        patient: {
          include: { user: { select: { name: true } } },
        },
        time_slot: true,
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 10,
    });

    const totalCompletedAppointments = await prisma.appointment.count({
      where: {
        doctor_id: doctorId,
        status: "completed",
      },
    });

    const totalScheduledAppointments = await prisma.appointment.count({
      where: {
        doctor_id: doctorId,
        status: { in: ["completed", "cancelled", "no_show"] },
      },
    });

    const completionRate =
      totalScheduledAppointments > 0
        ? Number(
            (
              (totalCompletedAppointments / totalScheduledAppointments) *
              100
            ).toFixed(2)
          )
        : 0;

    const appointmentsByDay = await prisma.appointment.findMany({
      where: {
        doctor_id: doctorId,
        time_slot: {
          date: {
            gte: new Date(new Date().setDate(today.getDate() - 30)),
          },
        },
      },
      include: {
        time_slot: {
          select: { date: true },
        },
      },
    });

    const dayCount = {};
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    appointmentsByDay.forEach((appointment) => {
      const date = new Date(appointment.time_slot.date);
      const dayOfWeek = daysOfWeek[date.getDay()];
      dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1;
    });

    const busiestDays = Object.entries(dayCount)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);

    const formattedTodayAppointments = todayAppointments.map((appointment) => ({
      id: appointment.id,
      patient_name: appointment.patient.user.name,
      start_time: appointment.time_slot.start_time
        .toISOString()
        .substring(11, 16),
      end_time: appointment.time_slot.end_time.toISOString().substring(11, 16),
      status: appointment.status,
    }));

    const formattedRecentAppointments = recentAppointments.map(
      (appointment) => ({
        id: appointment.id,
        patient_name: appointment.patient.user.name,
        date: appointment.time_slot.date.toISOString().split("T")[0],
        time: appointment.time_slot.start_time.toISOString().substring(11, 16),
        status: appointment.status,
      })
    );

    res.status(200).json({
      today: {
        count: todayAppointments.length,
        appointments: formattedTodayAppointments,
      },
      thisWeek: {
        count: weekAppointments.length,
        daysWithAppointments: [
          ...new Set(
            weekAppointments.map(
              (a) => a.time_slot.date.toISOString().split("T")[0]
            )
          ),
        ].length,
      },
      recent: {
        appointments: formattedRecentAppointments,
      },
      metrics: {
        completionRate,
        cancelRate:
          totalScheduledAppointments > 0
            ? Number(
                (
                  ((totalScheduledAppointments - totalCompletedAppointments) /
                    totalScheduledAppointments) *
                  100
                ).toFixed(2)
              )
            : 0,
      },
      busiest: {
        days: busiestDays.slice(0, 3),
      },
    });
  } catch (error) {
    console.error("Appointment analytics error:", error);
    res.status(500).json({ error: "Failed to fetch appointment analytics" });
  }
};

const getPatientInsights = async (req, res) => {
  try {
    const doctorId = req.user.doctorProfile.id;

    const patients = await prisma.appointment.findMany({
      where: { doctor_id: doctorId },
      select: {
        patient_id: true,
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                created_at: true,
              },
            },
          },
        },
        created_at: true,
      },
      distinct: ["patient_id"],
    });

    const genderDistribution = await prisma.patient.groupBy({
      by: ["gender"],
      where: {
        id: {
          in: patients.map((p) => p.patient_id),
        },
      },
      _count: { id: true },
    });

    const genderStats = {};
    genderDistribution.forEach((g) => {
      genderStats[g.gender || "Not Specified"] = g._count.id;
    });

    const patientsWithDOB = await prisma.patient.findMany({
      where: {
        id: {
          in: patients.map((p) => p.patient_id),
        },
        date_of_birth: { not: null },
      },
      select: {
        id: true,
        date_of_birth: true,
      },
    });

    const ageGroups = {
      "Under 18": 0,
      "18-30": 0,
      "31-45": 0,
      "46-60": 0,
      "Over 60": 0,
    };

    patientsWithDOB.forEach((patient) => {
      const birthDate = new Date(patient.date_of_birth);
      const age = new Date().getFullYear() - birthDate.getFullYear();

      if (age < 18) ageGroups["Under 18"]++;
      else if (age <= 30) ageGroups["18-30"]++;
      else if (age <= 45) ageGroups["31-45"]++;
      else if (age <= 60) ageGroups["46-60"]++;
      else ageGroups["Over 60"]++;
    });

    const appointmentCounts = await prisma.appointment.groupBy({
      by: ["patient_id"],
      where: { doctor_id: doctorId },
      _count: { id: true },
    });

    const returningPatients = appointmentCounts.filter(
      (p) => p._count.id > 1
    ).length;
    const oneTimePatients = appointmentCounts.filter(
      (p) => p._count.id === 1
    ).length;

    const topPatients = await prisma.appointment.groupBy({
      by: ["patient_id"],
      where: { doctor_id: doctorId },
      _count: { id: true },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    const topPatientsDetails = await Promise.all(
      topPatients.map(async (p) => {
        const patient = await prisma.patient.findUnique({
          where: { id: p.patient_id },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          id: patient.id,
          name: patient.user.name,
          email: patient.user.email,
          appointmentCount: p._count.id,
        };
      })
    );

    const newVsReturningRatio = {
      new: oneTimePatients,
      returning: returningPatients,
      returnRate:
        patients.length > 0
          ? Number(((returningPatients / patients.length) * 100).toFixed(2))
          : 0,
    };

    res.status(200).json({
      total: patients.length,
      demographics: {
        gender: genderStats,
        ageGroups: patientsWithDOB.length > 0 ? ageGroups : "Insufficient data",
      },
      patientEngagement: {
        newVsReturning: newVsReturningRatio,
        topPatients: topPatientsDetails,
      },
      patientTrends: {
        growthRate:
          "Data will be available after you've been using the platform longer",
      },
    });
  } catch (error) {
    console.error("Patient insights error:", error);
    res.status(500).json({ error: "Failed to fetch patient insights" });
  }
};

const uploadDoctorPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.id } });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    const imageUrl = `uploads/doctors/${req.file.filename}`;

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { image_url: imageUrl },
    });

    return res.status(200).json({ message: "Photo uploaded successfully", image_url: buildImageUrl(req, imageUrl) });
  } catch (error) {
    console.error("Upload doctor photo error:", error);
    return res.status(500).json({ error: "Failed to upload photo" });
  }
};

module.exports = {
  getGeneralStats,
  getAppointmentAnalytics,
  getPatientInsights,
  getAllDoctors,
  getDoctorById,
  getDoctorsBySpeciality,
  getAllSpecialities,
  getDoctorsByFeeRange,
  getDoctorPatients,
  getPatientDetails,
  uploadDoctorPhoto,
  trial,
};
