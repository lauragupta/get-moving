const router = require("express").Router();
const { Activity, User, Attendance } = require("../models");
const withAuth = require("../utils/auth");
const { Op } = require("sequelize");

// GET all activities
router.get("/", async (req, res) => {
  try {
    const dBActivityData = await Activity.findAll({
      include: [
        {
          model: User,
          through: Attendance,
          as: "activity_attendances",
        },
      ],
    });

    // const dBattendanceData = await Attendance.findAll({});

    // console.log("check attendance name", dBattendanceData);
    // Serialize data so the template can read it
    const activities = dBActivityData.map((activity) =>
      activity.get({ plain: true })
    );

    console.log(
      "check activites",
      JSON.stringify(activities[0].activity_attendances)
    );

    // Pass serialized data and session flag into template
    res.render("homepage", {
      activities,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.get("/login", (req, res) => {
  // If the user is already logged in, redirect the request to another route
  if (req.session.logged_in) {
    res.redirect("/homepage");
    return;
  }

  res.render("login");
});

//get single user by logged in id
router.get("/profile", withAuth, async (req, res) => {
  try {
    // Find the logged in user based on the session ID
    const userData = await User.findByPk(req.session.user_id, {
      attributes: { exclude: ["password"] },
      include: [{ model: Activity }, { model: Attendance }],
    });

    const user = userData.get({ plain: true });

    res.render("profile", {
      ...user,
      logged_in: true,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

//get activity by username
router.get("/activity", withAuth, async (req, res) => {
  try {
    const activityData = await Activity.findAll({
      where: {
        user_id: {
          [Op.eq]: req.session.user_id,
        },
      },
      attributes: { exclude: ["password"] },

      // include: [
      //   {
      //     model: User,
      //     attributes: ["name"],
      //   },
      // ],
    });

    console.log("user id", req.session.user_id);
    // Serialize data so the template can read it
    const activities = activityData.map((activity) =>
      activity.get({ plain: true })
    );

    const userData = await User.findOne({ where: { id: req.session.user_id } });
    const user = userData.get({ plain: true });

    console.log(" activites by logged in user", user);

    res.render("activity", {
      activities,
      user,
      logged_in: req.session.logged_in,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

module.exports = router;
