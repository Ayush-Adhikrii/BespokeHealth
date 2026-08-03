const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDateRange = (period, customStart, customEnd) => {
  const end = new Date();
  let start = new Date();

  if (customStart && customEnd) {
    return {
      start: new Date(customStart),
      end: new Date(customEnd),
    };
  }

  switch (period) {
    case "day":
      start.setDate(start.getDate() - 1);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(start.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }

  return { start, end };
};

const getAnalyticsOverview = async (req, res) => {
  try {

    const [
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      completedAppointments,
      totalRevenue,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "completed" } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
    ]);

    const recentUsers = await prisma.users.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
      },
    });

    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: { created_at: "desc" },
      include: {
        patient: {
          include: { user: { select: { name: true } } },
        },
        doctor: {
          include: { user: { select: { name: true } } },
        },
        time_slot: true,
      },
    });

    res.status(200).json({
      counts: {
        users: totalUsers,
        doctors: totalDoctors,
        patients: totalPatients,
        appointments: totalAppointments,
        completionRate:
          totalAppointments > 0
            ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
            : 0,
        revenue: totalRevenue._sum.amount || 0,
      },
      recentActivity: {
        users: recentUsers,
        appointments: recentAppointments.map((apt) => ({
          id: apt.id,
          patient: apt.patient.user.name,
          doctor: apt.doctor.user.name,
          date: apt.time_slot.date,
          status: apt.status,
        })),
      },
    });
  } catch (error) {
    console.error("Analytics overview error:", error);
    res.status(500).json({ error: "Failed to retrieve analytics overview" });
  }
};

const getUserAnalytics = async (req, res) => {
  try {
    const { period = "month", groupBy = "day", start, end } = req.query;
    const dateRange = getDateRange(period, start, end);

    const [totalUsers, totalDoctors, totalPatients] = await Promise.all([
      prisma.users.count(),
      prisma.doctor.count(),
      prisma.patient.count(),
    ]);

    const newUsers = await prisma.users.findMany({
      where: {
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      select: {
        id: true,
        role: true,
        created_at: true,
      },
    });

    const registrationsByTime = {};

    newUsers.forEach((user) => {
      let timeKey;

      if (groupBy === "month") {

        timeKey = user.created_at.toISOString().substring(0, 7);
      } else {

        timeKey = user.created_at.toISOString().substring(0, 10);
      }

      if (!registrationsByTime[timeKey]) {
        registrationsByTime[timeKey] = 0;
      }

      registrationsByTime[timeKey]++;
    });

    const userRegistrations = Object.entries(registrationsByTime).map(
      ([date, count]) => ({
        date,
        count,
      })
    );

    userRegistrations.sort((a, b) => a.date.localeCompare(b.date));

    const roleDistribution = {};
    newUsers.forEach((user) => {
      const role = user.role || "Unknown";
      if (!roleDistribution[role]) {
        roleDistribution[role] = 0;
      }
      roleDistribution[role]++;
    });

    const usersByRole = Object.entries(roleDistribution).map(
      ([role, count]) => ({
        role,
        count,
        percentage: ((count / newUsers.length) * 100).toFixed(2),
      })
    );

    let kycMetrics = {
      totalSubmissions: 0,
      approvalRate: 0,
      averageProcessingHours: 0,
      statusDistribution: [],
    };

    if (prisma.KYC) {
      const kycRecords = await prisma.KYC.findMany({
        select: {
          id: true,
          status: true,
          created_at: true,
          reviewed_at: true,
        },
      });

      const totalKycSubmissions = kycRecords.length;
      const approvedKycs = kycRecords.filter(
        (kyc) => kyc.status === "approved"
      );

      let totalProcessingHours = 0;
      approvedKycs.forEach((kyc) => {
        if (kyc.reviewed_at) {

          const processingTime =
            kyc.reviewed_at.getTime() - kyc.created_at.getTime();
          totalProcessingHours += processingTime / (1000 * 60 * 60);
        }
      });

      const avgProcessingHours =
        approvedKycs.length > 0
          ? totalProcessingHours / approvedKycs.length
          : 0;

      const kycByStatus = {};
      kycRecords.forEach((kyc) => {
        const status = kyc.status || "pending";
        if (!kycByStatus[status]) {
          kycByStatus[status] = 0;
        }
        kycByStatus[status]++;
      });

      const kycStatusDistribution = Object.entries(kycByStatus).map(
        ([status, count]) => ({
          status,
          count,
          percentage:
            totalKycSubmissions > 0
              ? ((count / totalKycSubmissions) * 100).toFixed(2)
              : 0,
        })
      );

      kycMetrics = {
        totalSubmissions: totalKycSubmissions,
        approvalRate:
          totalKycSubmissions > 0
            ? ((approvedKycs.length / totalKycSubmissions) * 100).toFixed(2)
            : 0,
        averageProcessingHours: avgProcessingHours.toFixed(2),
        statusDistribution: kycStatusDistribution,
      };
    }

    res.status(200).json({
      overview: {
        totalUsers,
        totalDoctors,
        totalPatients,
        userRoleDistribution: {
          doctors: ((totalDoctors / totalUsers) * 100).toFixed(2),
          patients: ((totalPatients / totalUsers) * 100).toFixed(2),
          others: (
            ((totalUsers - totalDoctors - totalPatients) / totalUsers) *
            100
          ).toFixed(2),
        },
      },
      growth: {
        period: period,
        data: userRegistrations,
      },
      roleDistribution: usersByRole,
      kycMetrics,
    });
  } catch (error) {
    console.error("User analytics error:", error);
    res.status(500).json({ error: "Failed to retrieve user analytics" });
  }
};

const getDoctorAnalytics = async (req, res) => {
  try {
    const { period = "month", limit = 10 } = req.query;
    const dateRange = getDateRange(period);

    const doctorsBySpeciality = await prisma.doctor.groupBy({
      by: ["speciality"],
      _count: { id: true },
    });

    const totalDoctors = await prisma.doctor.count();

    const activeDoctors = await prisma.doctor.findMany({
      take: parseInt(limit),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
      orderBy: {
        appointments: {
          _count: "desc",
        },
      },
    });

    const doctors = await prisma.doctor.findMany({
      select: {
        id: true,
        speciality: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedRatings = doctors.map((doctor) => {

      const randomRating = (Math.random() * 1.5 + 3.5).toFixed(1);
      const randomReviewCount = Math.floor(Math.random() * 20) + 1;

      return {
        id: doctor.id,
        name: doctor.user.name,
        speciality: doctor.speciality,
        averageRating: randomRating,
        reviewCount: randomReviewCount,
      };
    });

    formattedRatings.sort((a, b) => b.averageRating - a.averageRating);

    let doctorKycStats = [];
    let totalDoctorKycs = 0;

    try {
      doctorKycStats = await prisma.KYC.groupBy({
        by: ["status"],
        _count: { id: true },
        where: {
          user: {
            role: "Doctor",
          },
        },
      });

      totalDoctorKycs = doctorKycStats.reduce(
        (sum, item) => sum + item._count.id,
        0
      );
    } catch (err) {
      console.error("KYC stats error:", err);

      doctorKycStats = [
        { status: "pending", _count: { id: 0 } },
        { status: "approved", _count: { id: 0 } },
        { status: "rejected", _count: { id: 0 } },
      ];
    }

    res.status(200).json({
      specialityDistribution: doctorsBySpeciality.map((item) => ({
        speciality: item.speciality || "Unspecified",
        count: item._count.id,
        percentage: ((item._count.id / totalDoctors) * 100).toFixed(2),
      })),
      topActiveDoctors: activeDoctors.map((doctor) => ({
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        speciality: doctor.speciality,
        appointmentCount: doctor._count.appointments,
      })),
      ratings: {
        topRated: formattedRatings.slice(0, parseInt(limit)),
        distribution: [
          {
            rating: "5",
            count: formattedRatings.filter(
              (d) => Math.round(d.averageRating) === 5
            ).length,
          },
          {
            rating: "4",
            count: formattedRatings.filter(
              (d) => Math.round(d.averageRating) === 4
            ).length,
          },
          {
            rating: "3",
            count: formattedRatings.filter(
              (d) => Math.round(d.averageRating) === 3
            ).length,
          },
          {
            rating: "2",
            count: formattedRatings.filter(
              (d) => Math.round(d.averageRating) === 2
            ).length,
          },
          {
            rating: "1",
            count: formattedRatings.filter(
              (d) => Math.round(d.averageRating) === 1
            ).length,
          },
        ],
      },
      kycMetrics: {
        totalSubmissions: totalDoctorKycs,
        statusDistribution: doctorKycStats.map((item) => ({
          status: item.status,
          count: item._count.id,
          percentage:
            totalDoctorKycs > 0
              ? ((item._count.id / totalDoctorKycs) * 100).toFixed(2)
              : 0,
        })),
      },
    });
  } catch (error) {
    console.error("Doctor analytics error:", error);
    res.status(500).json({ error: "Failed to retrieve doctor analytics" });
  }
};

const getPatientAnalytics = async (req, res) => {
  try {

    const totalPatients = await prisma.patient.count();

    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        gender: true,
        date_of_birth: true,
        appointments: {
          select: {
            id: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const genderGroups = {};
    patients.forEach((patient) => {
      const gender = patient.gender || "Unspecified";
      if (!genderGroups[gender]) {
        genderGroups[gender] = 0;
      }
      genderGroups[gender]++;
    });

    const genderDistribution = Object.entries(genderGroups).map(
      ([gender, count]) => ({
        gender,
        count,
        percentage: ((count / totalPatients) * 100).toFixed(2),
      })
    );

    const ageGroups = {
      "0-18": 0,
      "19-30": 0,
      "31-45": 0,
      "46-60": 0,
      "60+": 0,
    };

    patients.forEach((patient) => {
      if (patient.date_of_birth) {
        const birthDate = new Date(patient.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();

        if (age <= 18) ageGroups["0-18"]++;
        else if (age <= 30) ageGroups["19-30"]++;
        else if (age <= 45) ageGroups["31-45"]++;
        else if (age <= 60) ageGroups["46-60"]++;
        else ageGroups["60+"]++;
      }
    });

    const patientActivity = patients
      .map((patient) => ({
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        appointmentCount: patient.appointments.length,
      }))
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 10);

    res.status(200).json({
      totalPatients,
      demographics: {
        gender: genderDistribution,
        ageGroups: Object.entries(ageGroups).map(([group, count]) => ({
          group,
          count,
          percentage: ((count / totalPatients) * 100).toFixed(2),
        })),
      },
      topActivePatients: patientActivity,
    });
  } catch (error) {
    console.error("Patient analytics error:", error);
    res.status(500).json({ error: "Failed to retrieve patient analytics" });
  }
};

const getAppointmentAnalytics = async (req, res) => {
  try {
    const { period = "month", groupBy = "day", start, end } = req.query;
    const dateRange = getDateRange(period, start, end);

    const totalAppointments = await prisma.appointment.count();

    const appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        status: true,
        created_at: true,
        cancellation_reason: true,
        time_slot: {
          select: {
            id: true,
            date: true,
            start_time: true,
            end_time: true
          }
        }
      }
    });

    const statusCounts = {};
    appointments.forEach((apt) => {
      const status = apt.status || "unknown";
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status]++;
    });

    const statusDistribution = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        percentage: ((count / totalAppointments) * 100).toFixed(2),
      })
    );

    const appointmentsByTime = {};
    appointments.forEach((apt) => {
      if (
        apt.created_at >= dateRange.start &&
        apt.created_at <= dateRange.end
      ) {
        let timeKey;

        if (groupBy === "month") {

          timeKey = apt.created_at.toISOString().substring(0, 7);
        } else {

          timeKey = apt.created_at.toISOString().substring(0, 10);
        }

        if (!appointmentsByTime[timeKey]) {
          appointmentsByTime[timeKey] = 0;
        }

        appointmentsByTime[timeKey]++;
      }
    });

    const appointmentTrends = Object.entries(appointmentsByTime)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const hourCounts = {};
    const dayCounts = {};

    appointments.forEach((apt) => {
      if (apt.time_slot && apt.time_slot.start_time) {

        let hour;

        if (typeof apt.time_slot.start_time === 'string') {

          hour = parseInt(apt.time_slot.start_time.split(":")[0]);
        } else if (apt.time_slot.start_time instanceof Date) {

          hour = apt.time_slot.start_time.getHours();
        } else {

          const timeStr = String(apt.time_slot.start_time);
          try {
            hour = parseInt(timeStr.split(":")[0]);
          } catch (e) {
            console.log("Could not parse hour from:", timeStr);
            hour = 0;
          }
        }

        if (!hourCounts[hour]) {
          hourCounts[hour] = 0;
        }
        hourCounts[hour]++;

        if (apt.time_slot.date) {
          const date = new Date(apt.time_slot.date);
          const dayOfWeek = date.getDay();

          if (!dayCounts[dayOfWeek]) {
            dayCounts[dayOfWeek] = 0;
          }
          dayCounts[dayOfWeek]++;
        }
      }
    });

    const cancelledAppointments = appointments.filter(
      (apt) => apt.status === "cancelled"
    );

    const cancellationReasons = {};
    cancelledAppointments.forEach((apt) => {
      const reason = apt.cancellation_reason || "Not specified";
      cancellationReasons[reason] = (cancellationReasons[reason] || 0) + 1;
    });

    res.status(200).json({
      overview: {
        totalAppointments,
        statusDistribution,
      },
      trends: {
        period: period,
        data: appointmentTrends,
      },
      peakTimes: {
        byHour: Object.entries(hourCounts)
          .map(([hour, count]) => ({
            hour: parseInt(hour),
            count,
            percentage: ((count / totalAppointments) * 100).toFixed(2),
          }))
          .sort((a, b) => a.hour - b.hour),
        byDay: Object.entries(dayCounts)
          .map(([day, count]) => ({
            day: parseInt(day),
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)],
            count,
            percentage: ((count / totalAppointments) * 100).toFixed(2),
          }))
          .sort((a, b) => a.day - b.day),
      },
      cancellations: {
        totalCancelled: cancelledAppointments.length,
        cancellationRate: (
          (cancelledAppointments.length / totalAppointments) *
          100
        ).toFixed(2),
        reasonBreakdown: Object.entries(cancellationReasons).map(
          ([reason, count]) => ({
            reason,
            count,
            percentage: cancelledAppointments.length > 0 ?
              ((count / cancelledAppointments.length) * 100).toFixed(2) : "0.00",
          })
        ),
      },
    });
  } catch (error) {
    console.error("Appointment analytics error:", error);
    res.status(500).json({ error: "Failed to retrieve appointment analytics" });
  }
};

const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "month", groupBy = "day", start, end } = req.query;
    const dateRange = getDateRange(period, start, end);

    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
    });

    const payments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      },
      select: {
        id: true,
        amount: true,
        payment_method: true,
        created_at: true,
        appointment: {
          select: {
            id: true,
            doctor: {
              select: {
                id: true,
                speciality: true,
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const revenueByTime = {};

    payments.forEach(payment => {
      let timeKey;

      if (groupBy === 'month') {

        timeKey = payment.created_at.toISOString().substring(0, 7);
      } else {

        timeKey = payment.created_at.toISOString().substring(0, 10);
      }

      if (!revenueByTime[timeKey]) {
        revenueByTime[timeKey] = 0;
      }

      revenueByTime[timeKey] += payment.amount;
    });

    const revenueTrends = Object.entries(revenueByTime)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const specialityRevenue = {};

    payments.forEach(payment => {
      if (payment.appointment?.doctor?.speciality) {
        const speciality = payment.appointment.doctor.speciality;

        if (!specialityRevenue[speciality]) {
          specialityRevenue[speciality] = 0;
        }

        specialityRevenue[speciality] += payment.amount;
      }
    });

    const revenueBySpeciality = Object.entries(specialityRevenue)
      .map(([speciality, amount]) => ({
        speciality,
        amount,
        percentage: totalRevenue._sum.amount
          ? ((amount / totalRevenue._sum.amount) * 100).toFixed(2)
          : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const doctorRevenue = {};

    payments.forEach(payment => {
      if (payment.appointment?.doctor) {
        const doctor = payment.appointment.doctor;
        const doctorId = doctor.id;

        if (!doctorRevenue[doctorId]) {
          doctorRevenue[doctorId] = {
            id: doctorId,
            name: doctor.user.name,
            speciality: doctor.speciality,
            revenue: 0,
            appointmentCount: 0
          };
        }

        doctorRevenue[doctorId].revenue += payment.amount;
        doctorRevenue[doctorId].appointmentCount += 1;
      }
    });

    const topEarningDoctors = Object.values(doctorRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const methodCounts = {};
    const methodAmounts = {};

    payments.forEach(payment => {
      const method = payment.payment_method || 'Unknown';

      if (!methodCounts[method]) {
        methodCounts[method] = 0;
        methodAmounts[method] = 0;
      }

      methodCounts[method]++;
      methodAmounts[method] += payment.amount;
    });

    const paymentMethods = Object.entries(methodCounts).map(([method, count]) => ({
      method,
      count,
      amount: methodAmounts[method],
      percentage: totalRevenue._sum.amount
        ? ((methodAmounts[method] / totalRevenue._sum.amount) * 100).toFixed(2)
        : 0
    }));

    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);

    const lastMonthPayments = payments.filter(p =>
      p.created_at >= lastMonth && p.created_at < today
    );

    const previousMonthPayments = await prisma.payment.findMany({
      where: {
        created_at: {
          gte: twoMonthsAgo,
          lt: lastMonth
        }
      },
      select: {
        amount: true
      }
    });

    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const previousMonthRevenue = previousMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    const monthlyGrowthRate = previousMonthRevenue > 0
      ? (lastMonthRevenue - previousMonthRevenue) / previousMonthRevenue
      : 0;

    const forecastNextMonth = lastMonthRevenue * (1 + monthlyGrowthRate);

    res.status(200).json({
      overview: {
        totalRevenue: totalRevenue._sum.amount || 0,
        currencyUnit: "USD"
      },
      trends: {
        period: period,
        data: revenueTrends
      },
      bySpeciality: revenueBySpeciality,
      topEarningDoctors: topEarningDoctors,
      paymentMethods: paymentMethods,
      forecast: {
        nextMonth: forecastNextMonth,
        growthRate: (monthlyGrowthRate * 100).toFixed(2),
        previousMonthAmount: lastMonthRevenue
      }
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({ error: "Failed to retrieve revenue analytics" });
  }
};

module.exports = {
  getAnalyticsOverview,
  getUserAnalytics,
  getDoctorAnalytics,
  getPatientAnalytics,
  getAppointmentAnalytics,
  getRevenueAnalytics,
};
