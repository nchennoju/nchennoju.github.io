/* ============================================================
   Nitish Chennoju — portfolio interactions
   Vanilla JS. No jQuery. Handles theme, parallax, reveals,
   typed hero, counters, projects, filtering, and Plotly charts.
   ============================================================ */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- THEME: follow system, allow manual toggle ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var mql = window.matchMedia("(prefers-color-scheme: light)");
  var stored = null;
  try { stored = localStorage.getItem("nc-theme"); } catch (e) {}

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (toggle) {
      toggle.innerHTML = theme === "light"
        ? '<i class="fa fa-sun-o"></i>'
        : '<i class="fa fa-moon-o"></i>';
    }
    restylePlots(theme);
  }
  // initial: stored preference wins, else follow system
  applyTheme(stored || (mql.matches ? "light" : "dark"));

  // react to OS theme changes live (only when user hasn't overridden)
  mql.addEventListener("change", function (e) {
    var override = null;
    try { override = localStorage.getItem("nc-theme"); } catch (err) {}
    if (!override) applyTheme(e.matches ? "light" : "dark");
  });

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("nc-theme", next); } catch (e) {}
    });
  }

  /* ---------- NAV: scroll state, mobile menu, active link ---------- */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");

  function onScroll() {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
    var bt = document.getElementById("backTop");
    if (window.scrollY > 600) bt.classList.add("show"); else bt.classList.remove("show");
    updateParallax();
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  if (burger) {
    burger.addEventListener("click", function () { navLinks.classList.toggle("open"); });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") navLinks.classList.remove("open");
    });
  }

  document.getElementById("backTop").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  // active nav link via scroll spy
  var links = Array.prototype.slice.call(navLinks.querySelectorAll("a"));
  var sections = links.map(function (a) {
    var id = a.getAttribute("href").replace("#", "");
    return document.getElementById(id === "top" ? "top" : id);
  });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        var id = en.target.id;
        links.forEach(function (a) {
          var href = a.getAttribute("href");
          a.classList.toggle("active", href === "#" + id || (id === "top" && href === "#top"));
        });
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(function (s) { if (s) spy.observe(s); });

  /* ---------- PARALLAX ---------- */
  var pElems = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  function updateParallax() {
    if (reduceMotion) return;
    var vh = window.innerHeight;
    pElems.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var speed = parseFloat(el.getAttribute("data-parallax")) || 0.3;
      var offset = (r.top + r.height / 2 - vh / 2) * speed * -1;
      el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    });
  }

  /* ---------- REVEAL ON SCROLL ---------- */
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); revealer.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { revealer.observe(el); });
  }

  /* ---------- COUNTERS ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dec = target % 1 !== 0 ? 1 : 0;
    if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
    var start = 0, dur = 1500, t0 = null;
    // back-out easing: the value shoots slightly past the target then settles,
    // like an analog needle finding its mark.
    function easeOutBack(p) {
      var c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = easeOutBack(p);
      var val = start + (target - start) * eased;
      // clamp the visible overshoot so it never renders a nonsensical number
      if (p >= 1) val = target;
      el.textContent = (dec ? val.toFixed(1) : Math.round(val)).toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { animateCount(en.target); countObs.unobserve(en.target); }
    });
  }, { threshold: 0.5 });

  /* ---------- SKILL BARS ---------- */
  var SKILLS = [
    { name: "Python", v: 90 }, { name: "C / C++ / Embedded", v: 85 },
    { name: "Avionics & DAQ", v: 88 }, { name: "Java", v: 75 },
    { name: "SolidWorks / CAD", v: 65 }, { name: "Test Automation", v: 85 }
  ];
  var skillWrap = document.getElementById("skills");
  SKILLS.forEach(function (s) {
    var d = document.createElement("div");
    d.className = "skill";
    d.innerHTML = '<div class="skill-top"><span>' + s.name + '</span><span>' + s.v + '%</span></div>' +
                  '<div class="bar"><i data-w="' + s.v + '"></i></div>';
    skillWrap.appendChild(d);
  });
  var barObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.style.width = en.target.getAttribute("data-w") + "%";
        barObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll(".bar > i").forEach(function (b) { barObs.observe(b); });

  /* ---------- TYPED HERO ---------- */
  var TAGLINES = [
    "Launch Engineer @ Stoke Space",
    "Instrumentation & Controls — 2,000+ channels",
    "Ex-Mach Industries Autonomous Systems Lead",
    "Ex-Blue Origin Launch Avionics",
    "Ex-SpaceX Avionics Test Engineer",
    "Former UCI Rocket Project Chief Engineer",
    "Autonomous Vehicle Builder",
    "Aerospace Enthusiast & Maker",
    "Troop 390 Eagle Scout"
  ];
  (function typeLoop() {
    var el = document.getElementById("typed");
    if (!el) return;
    if (reduceMotion) { el.textContent = TAGLINES[0]; return; }
    var i = 0, c = 0, deleting = false;
    function tick() {
      var full = TAGLINES[i];
      c += deleting ? -1 : 1;
      el.textContent = full.substring(0, c);
      var delay = deleting ? 34 : 68;
      if (!deleting && c === full.length) { delay = 1600; deleting = true; }
      else if (deleting && c === 0) { deleting = false; i = (i + 1) % TAGLINES.length; delay = 300; }
      setTimeout(tick, delay);
    }
    tick();
  })();

  /* ---------- ROTATING QUOTE ---------- */
  var QUOTES = [
    ['"I could either watch it happen or be a part of it."', "— Elon Musk"],
    ['"Once you stop learning, you start dying."', "— Albert Einstein"],
    ['"I have not failed. I\'ve just found 10,000 ways that won\'t work."', "— Thomas Edison"],
    ['"Take chances, make mistakes, get messy!"', "— Ms. Frizzle"]
  ];
  (function rotateQuote() {
    var q = document.getElementById("quote"), a = document.getElementById("quote-author");
    if (!q) return;
    var i = 0;
    setInterval(function () {
      i = (i + 1) % QUOTES.length;
      q.style.opacity = 0; a.style.opacity = 0;
      setTimeout(function () {
        q.textContent = QUOTES[i][0]; a.textContent = QUOTES[i][1];
        q.style.transition = a.style.transition = "opacity .6s"; q.style.opacity = 1; a.style.opacity = 1;
      }, 500);
    }, 5000);
  })();

  /* ---------- EXPERIENCE TIMELINE DATA ---------- */
  var EXPERIENCE = [
    { role: "Stoke Space — Launch Engineer, Instrumentation & Controls", when: "Nov 2025 – Present",
      body: "I own pad-wide DAQ and instrumentation, integrating 2,000+ channels across cryogenic, pneumatic, electrical, environmental, and facility systems.",
      pts: ["Select & integrate UEI/Beckhoff DAQ, remote I/O, signal conditioning & sensors (sample rate, isolation, accuracy, redundancy, cost)",
            "Develop & troubleshoot Modbus TCP/RTU — register maps, scaling, bit extraction, endianness, polling, timeouts, command handling",
            "Build SCADA alarms & validation logic for FCVs, solenoids, triplicate sensors, electrical limits, command/feedback mismatches & equipment health",
            "Python tools for automated checkout, config backup/diff, network/NTP health, Modbus diagnostics & telemetry anomaly detection",
            "Commission valves, VFDs, chillers, gas detectors, power supplies, DAQs, timing & launch-release hardware during integrated ops"] },
    { role: "Mach Industries — Autonomous Systems Lead, Flight Test", when: "May 2025 – Nov 2025",
      body: "Directed autonomous VTOL test campaigns and served as Test Director for five successful terminal-strike flight tests.",
      pts: ["Built automated reporting & validation pipelines for ATP, QTP, and flight-test data",
            "Unified telemetry ingestion, validation & post-processing",
            "Troubleshot avionics, controls, communications & ground systems"] },
    { role: "Blue Origin — Launch Engineer, Avionics", when: "Sep 2024 – Feb 2025",
      body: "Console-certified Instrumentation & Controls engineer supporting New Glenn vehicle integration and launch operations.",
      pts: ["Developed launch automation interfaces & performed hardware-in-the-loop testing of flight systems and ground control panels",
            "Supported vehicle integration & launch operations on console",
            "Validated flight-to-ground command, telemetry, timing & electrical interfaces; resolved system anomalies"] },
    { role: "SpaceX — Avionics Test Engineer", when: "Jul 2023 – Sep 2024",
      body: "Executed Falcon and Dragon avionics qualification and acceptance testing across functional and environmental regimes.",
      pts: ["Developed Python automation for high-pressure gas, thermal-vacuum & rate-table testing",
            "Led test-system & DAQ bring-up — improved accuracy 4× and cut setup time 50%",
            "Integrated & troubleshot flight hardware, ECLSS avionics, test racks, harnessing, instrumentation & control interfaces"] },
    { role: "UCI Rocket Project — Chief Engineer", when: "Jun 2022 – Jun 2023",
      body: "Led the team through countless hours to UC Irvine's first methalox rocket launch. Full deep-dive in the UCI Rocket section above.",
      pts: ["Launched UCI's first bipropellant liquid rocket", "Vertical test firing of collegiate methalox engine (engine operator)",
            "Built avionics network comms system + control GUI", "Wrote procedures for cold-flow, static fire & launch"] },
    { role: "Relativity Space — DACS Intern", when: "Jun 2022 – Aug 2022",
      body: "First professional experience in private space. Witnessed weekly Aeon 1 hot fires and a full Terran 1 mission cycle.",
      pts: ["Designed test-stand DAQ & controls using Beckhoff PLC/EtherCAT hardware; selected sensors, I/O & comms interfaces",
            "Developed automated gas-leak/flame detection and test-data/video-processing pipelines",
            "Built a solar construction time-lapse camera"] },
    { role: "UCI Rocket Project — Avionics Engineer", when: "Jun 2021 – Jun 2022",
      body: "Joined to enhance the avionics system while learning enough propulsion to bridge avionics and the rest of the project.",
      pts: ["RS485-based communication system", "Retrofitted the original NI DACS to work with the rocket",
            "Teensyduino-based engine control unit (ECU) + software", "Flight GUI for avionics instrumentation",
            "Engine GUI for chill, fill & fire operations"] },
    { role: "Open Networking Foundation — IoT / 5G Intern", when: "Aug 2020 – Mar 2021",
      body: "Built an IoT demo showcasing Aether's 5G edge compute — a modified developmental iRobot demonstrating increased traffic across the new 5G network.",
      pts: ["Evaluated IoT frameworks & communication platforms", "Interfaced with a 5G modem for a mobile IoT robot app"] },
    { role: "ASU — Fulton Undergraduate Research Initiative", when: "Oct 2019 – Dec 2020",
      body: "Researched fixed-wing electric-aircraft performance by building an instrumented mini aircraft measuring thrust, AoA, orientation, altitude, airspeed, battery current/voltage, motor RPM/torque, and temperature — logged for post-flight tuning of throttle & range.",
      pts: ["Custom flight controller logging at 100 Hz to microSD", "In-flight + post-flight digital/analog filtering",
            "Goal: optimize thrust lapse & aircraft range"] }
  ];
  var tl = document.getElementById("timeline");
  EXPERIENCE.forEach(function (e, idx) {
    var item = document.createElement("div");
    item.className = "tl-item reveal " + (idx % 2 ? "d1" : "");
    item.innerHTML = '<div class="tl-card"><h3>' + e.role + '</h3><div class="when">' + e.when + '</div>' +
      '<p>' + e.body + '</p><ul>' + e.pts.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ul></div>";
    tl.appendChild(item);
  });

  /* ---------- PROJECTS DATA ---------- */
  var P = "img/Projects/";
  var PROJECTS = [
    // featured
    { t: "UCI Rocket Project Journal", cat: "UCI Rocket", date: "Jun 2021", img: P+"3a.jpg", feat: 1,
      d: "My weekly journal logging all progress on the UCI Rocket Project — a running summary of my experience and everything I worked on.",
      links: [["Read journal", "https://docs.google.com/document/d/1KTQIJzyqYhP-Qn-f8gs7SRslmMdRTiT_wWV-RPc_aH4/edit?usp=sharing"]] },
    { t: "Sun Devil Rocketry — AIAA Paper", cat: "Rocketry", date: "Jun 2021", img: P+"2a.jpg", feat: 1,
      d: "Paper detailing a LOX/Kerosene rocket engine developed by ASU's Sun Devil Rocketry. I was on the avionics team assisting with GUI and engine-controller development.",
      links: [["AIAA DOI", "https://arc.aiaa.org/doi/10.2514/6.2020-3918"], ["PDF", "downloads/LiquidsAIAAPaper.pdf"]] },
    { t: "Fulton Undergraduate Research", cat: "Research", date: "May 2021", img: P+"1a.jpg", feat: 1,
      d: "My FURI research poster — electric-aircraft propulsion optimization using a custom flight controller to log flight characteristics.",
      links: [["FURI profile", "https://furi.engineering.asu.edu/participant/chennoju-nitish/"], ["Poster", "downloads/furiPoster.jpg"]] },
    // grid
    { t: "Wired Comms System", cat: "UCI Rocket", date: "Oct 2022", img: P+"29.jpg",
      d: "Network-based comms system for the UCI Rocket Project to actuate solenoids and stream sensor data on the ground. Replaced my RS485 system — now any device on the launch network (including phones) can control the vehicle.",
      links: [["GitHub", "https://github.com/UCI-Rocket-Project"]] },
    { t: "Flight Controller 3.0", cat: "Embedded", date: "Jun 2021", img: P+"28.jpg",
      d: "GPS-waypoint controller optimized for mission control — currently on UGVs, eventually miniaturized into a flight controller. GPS waypoint nav, telemetry, fast comms, PID control loop.",
      links: [["GitHub", "https://github.com/nchennoju/Arduino-GPS-Waypoint-UGV"]] },
    { t: "Telemetry GUI", cat: "Software", date: "Jun 2021", img: P+"27.png",
      d: "Python GUI displaying telemetry from Flight Controller 3.0 — attitude, PID input, distance to waypoint — plus a script to visualize real-time GPS position on Google Earth.",
      links: [["GitHub", "https://github.com/nchennoju/Arduino-GPS-Waypoint-UGV"]] },
    { t: "GPS UGV 2.0", cat: "Autonomous", date: "May 2021", img: P+"26.jpg",
      d: "Test platform for the GPS-waypoint controller on a DEERC RC truck. Dual-MCU setup: one reports GPS position & optimal heading, the other runs a PID loop to hold heading.",
      links: [["GitHub", "https://github.com/nchennoju/Arduino-GPS-Waypoint-UGV"]] },
    { t: "Blynk Web Control", cat: "Web", date: "Dec 2020", img: P+"24.jpg",
      d: "Using the Blynk REST API to control Blynk projects from a custom AJAX webpage — set up here to control my dorm door lock.",
      links: [["Live demo", "blynk.html"]] },
    { t: "Fitbit App: Lock Control", cat: "Web", date: "Dec 2020", img: P+"25.jpg",
      d: "IFTTT Webhooks + Blynk REST API to control projects from a Fitbit. Buttons change lock state; the status bar shows current state.",
      links: [["Live demo", "blynk.html"]] },
    { t: "iNav Quadcopter", cat: "Autonomous", date: "Dec 2020", img: P+"23S.jpg",
      d: "First quadcopter build with alt-hold, GPS-hold, RTH, waypoint missions and 3D mapping. 1800 kV motors + 35 A ESCs on 4S LiPo — specs close to a low-end racing/freestyle drone." },
    { t: "GPS UGV 1.0", cat: "Autonomous", date: "Nov 2020", img: P+"22S.jpg",
      d: "First test platform for the GPS-waypoint controller on a DEERC RC truck. Single MCU with bang-bang control for steering; user handles throttle for safety." },
    { t: "SDR Avionics GUI", cat: "Software", date: "2021", img: P+"21S.jpg",
      d: "GUI to automate and visualize Sun Devil Rocketry's liquid engine during testing — updated P&ID diagram plus sensor data in a gauge format.",
      links: [["GitHub", "https://github.com/nchennoju/SDR-Switch-Box"]] },
    { t: "Dining Hall Selector", cat: "Software", date: "Jun 2020", img: P+"19S.jpg",
      d: "Web-scraping program that picks the optimal ASU dining hall based on your liked/disliked foods, scoring each hall's live menu on a points system." },
    { t: "DIY Windmill", cat: "DIY", date: "Jun 2020", img: P+"18S.jpg",
      d: "Flat-plate windmill with modular blade angle and replaceable blades — built entirely from spare parts. Averages ~3 V (boostable to 12 V to charge a battery or run an inverter).",
      links: [["GrabCAD", "https://grabcad.com/library/diy-windmill-1"]] },
    { t: "Versa 2 Clock Face", cat: "Software", date: "May 2020", img: P+"17S.jpg",
      d: "Clean Fitbit clock face — battery level shown as a ring around the time, with seconds, time & date. An extra ring appears while charging.",
      links: [["Fitbit Gallery", "https://gallery.fitbit.com/details/82001c78-60ae-403c-8c1d-9ea26c95c401"]] },
    { t: "SIR Epidemic Model", cat: "Software", date: "Mar 2020", img: P+"16S.jpg",
      d: "Epidemic simulation following the SIR model — all cases tracked & plotted. See how limiting subject movement changes the curve.",
      links: [["GitHub", "https://github.com/nchennoju/Pandemic-Simulation"]] },
    { t: "Rocket Airbrake Mark 1", cat: "Rocketry", date: "Mar 2020", img: P+"20S.jpg",
      d: "Flat-plate airbrake that extends plates to induce drag — linear area/travel relationship simplifies deceleration math. Designed for SEDS Rocketry's Spaceport rocket to control apogee; still on the drawing board." },
    { t: "IoT Smart Camera", cat: "Software", date: "Feb 2020", img: P+"15S.jpg",
      d: "Pi Zero + Google Vision bonnet running a facial-detection classifier — captures an image when a face is detected and sends it to my email/phone, with optional local storage.",
      links: [["Video", "https://drive.google.com/file/d/1JvPVwVBjlD9VkHGYx-kTk1LwGTdcrmNe/view?usp=sharing"]] },
    { t: "IoT Door Lock", cat: "Embedded", date: "Jan 2020", img: P+"14S.jpg",
      d: "Designed & printed a mount to control my dorm door lock via app or smart-home assistant. Shown installed on the door.",
      links: [["Video", "https://drive.google.com/file/d/1JvPVwVBjlD9VkHGYx-kTk1LwGTdcrmNe/view?usp=sharing"]] },
    { t: "IoT Door Lock: Board", cat: "Embedded", date: "Jan 2020", img: P+"13S.jpg",
      d: "Custom board with an RGB LED to show lock status outside the door. Microcontroller: NodeMCU ESP8266.",
      links: [["GitHub", "https://github.com/nchennoju/Dorm-Door-Lock"]] },
    { t: "Gyro Rocket Mark 2", cat: "Rocketry", date: "Feb 2020", img: P+"12S.jpg",
      d: "Fin-stabilized rocket module — 4 equally-spaced fins for roll/pitch/yaw stability. 1S 500 mAh LiPo, Arduino Uno flight controller, 2.5\" body tube.",
      links: [["GitHub", "https://github.com/nchennoju/Ardu-Rocket"]] },
    { t: "Arduino UAV", cat: "Autonomous", date: "Ongoing", img: P+"11S.jpg",
      d: "My personal research project for a low-cost autonomous UAV. Based on an Arduino Nano — stabilizes in flight and holds a programmed altitude; upgrading to GPS-waypoint flight.",
      links: [["GitHub", "https://github.com/nchennoju/ArduinoUAV"]] },
    { t: "Flight Controller 2.0", cat: "Embedded", date: "Aug 2019", img: P+"10S.jpg",
      d: "The flight controller used in the low-cost autonomous UAV — gyro/magnetometer, altimeter, and buzzer.",
      links: [["GitHub", "https://github.com/nchennoju/ArduinoUAV/tree/master/RCTest4_GYRO"]] },
    { t: "Flight Controller 1.0", cat: "Embedded", date: "Jan 2019", img: P+"9S.jpg",
      d: "The first flight controller I built — enabled RC flight plus an altitude-hold mode modulating throttle and elevons to hold a set altitude.",
      links: [["GitHub", "https://github.com/nchennoju/ArduinoUAV/tree/master/RCTest3c_AltHold_FINAL_"]] },
    { t: "Camera Rocket Mark 2", cat: "Rocketry", date: "Apr 2019", img: P+"8.jpg",
      d: "Built to shoot aerial video for my high-school lip-dub, later reflown on a larger motor for School Launch Week and the Hiller Air Show.",
      links: [["Video", "https://www.youtube.com/watch?v=UQYyLKgbKs4"]] },
    { t: "Fin-Stab Rocket Mark 1", cat: "Rocketry", date: "Feb 2019", img: P+"7S.jpg",
      d: "A fin-stabilized rocket module built by my high-school club (ARC). Uses PD control to hold a set direction (up) during flight.",
      links: [["Video", "https://www.youtube.com/watch?v=UQYyLKgbKs4"]] },
    { t: "Camera Rocket Mark 1", cat: "Rocketry", date: "Apr 2019", img: P+"6.jpg",
      d: "The first camera-equipped rocket I flew — a makeshift payload bay from a milk-crate cap and a zip-tie. It got stuck in a tree, but we recovered the footage.",
      links: [["Video", "https://www.youtube.com/watch?v=UQYyLKgbKs4"]] },
    { t: "Founder & President — CHS Aviation & Rocketry Club", cat: "Clubs", date: "2017–2019", img: P+"5S.jpg",
      d: "Founded the club junior year with ~30 active members (peak 50). Led 5 model-rocketry launches and presented aerospace topics, alongside high-school physics teachers.",
      links: [["Club site", "https://chsarc.wixsite.com/chs-aviation"]] },
    { t: "Hiller Aviation Museum Launch", cat: "Clubs", date: "May 2019", img: P+"4S.jpg",
      d: "Organized a launch at a local aerospace museum — hosted a club booth and launched rockets as part of the annual Hiller Air Show.",
      links: [["Club site", "https://chsarc.wixsite.com/chs-aviation"]] },
    { t: "Eagle Project: Box Libraries", cat: "Boy Scouts", date: "Aug 2019", img: P+"2S.jpg",
      d: "For my Eagle project I built \"box libraries\" — book boxes placed in yards, stocked by community donations — after learning up to 61% of low-income families have no books at home.",
      links: [["Little Free Library", "https://littlefreelibrary.org/boy-scout-success-stories/"]] },
    { t: "UAV Test Platform", cat: "Embedded", date: "Jan 2019", img: P+"3S.jpg",
      d: "The bench platform I used to test flight-controller software before flying it — configured as a flying wing (two elevons + single motor).",
      links: [["Club site", "https://chsarc.wixsite.com/chs-aviation"]] },
    { t: "Foldable Kayak", cat: "Boy Scouts", date: "Sep 2018", img: P+"1S.jpg",
      d: "One of my first Boy Scout builds — a foldable kayak I made and paddled with my troop, later mounting a GoPro for some great footage.",
      links: [["Photos", "https://photos.app.goo.gl/mwf385ACTemyQTi18"]] },
    // fun / interactive microsites
    { t: "Hues & Cues Prompt Game", cat: "Fun", date: "2024", img: "img/project-bg.png",
      d: "A browser prompt game I built — generates color-based clue prompts for the Hues & Cues board game.",
      links: [["Play", "yo.html"]] },
    { t: "The ASU Outlook — Confessions", cat: "Web", date: "2020", img: "img/project-bg.png",
      d: "An anonymous student confessions / outlook page I built during my time at ASU.",
      links: [["Open", "confessions.html"]] },
    { t: "Test Report Viewer", cat: "Software", date: "2023", img: "img/project-bg.png",
      d: "A clean HTML test-report viewer for visualizing engineering test results.",
      links: [["Open", "test_report.html"]] },
    { t: "Interactive Greeting Cards", cat: "Fun", date: "2024–25", img: "img/project-bg.png",
      d: "A series of animated, interactive greeting-card microsites — a Ford's-Garage birthday card, a Porsche-themed card with audio, a Barbie card, and more.",
      links: [["Ford's Garage", "cards/bdaycard.html"], ["Barbie Deluxe", "cards/gpt2.html"]] },

    // free, reusable card templates — genericized versions of my cards for anyone to use
    { t: "3D Flip Birthday Card — Template", cat: "Templates", date: "2025", img: "img/project-bg.png",
      d: "Free, reusable template: a 3D flip birthday card with a hero cover, scrollable message, photos, and a confetti burst on open. Drop in your own text and images — everything is placeholder-ready and works with no external files.",
      links: [["Open template", "cards/templates/birthday-flip-card.html"]] },
    { t: "Candle Flip Card — Template", cat: "Templates", date: "2025", img: "img/project-bg.png",
      d: "Free template: a flip card with animated candle flames you can blow out with your mic, plus confetti and a relight button. Swap in your own message and photos.",
      links: [["Open template", "cards/templates/birthday-candle-flip-card.html"]] },
    { t: "Blow-Out-The-Candles Card — Template", cat: "Templates", date: "2025", img: "img/project-bg.png",
      d: "Free template: a minimal mic-driven birthday card — blow into the mic to snuff the candles and flip the card open. Requires microphone permission over http(s)/localhost.",
      links: [["Open template", "cards/templates/birthday-mic-blowout.html"]] },
    { t: "Barbie Birthday Card — Template", cat: "Templates", date: "2025", img: "img/project-bg.png",
      d: "Free template: a playful 3D flip card with mic blow-out, celebration audio hooks, and confetti. Add your own name, message, and sounds.",
      links: [["Open template", "cards/templates/birthday-barbie-card.html"]] },
    { t: "Retro Car Birthday Card — Template", cat: "Templates", date: "2025", img: "img/project-bg.png",
      d: "Free template: a retro/sage car-themed birthday card with mic blow-out candles, a 3D flip, and confetti. Optional engine-rev / sound hooks are wired but empty for you to fill.",
      links: [["Open template", "cards/templates/birthday-retro-car-card.html"]] },
    { t: "Anniversary Photo Card — Template", cat: "Templates", date: "2025", img: "img/project-bg.png",
      d: "Free template: a paper-anniversary card with a photo cover, 3D flip, falling-petal confetti, and an auto-advancing 9-photo flip slideshow. Point the photo array at your own images.",
      links: [["Open template", "cards/templates/anniversary-photo-slideshow.html"]] }
  ];

  var CATS = ["All"].concat(PROJECTS.map(function (p) { return p.cat; })
    .filter(function (c, i, a) { return a.indexOf(c) === i; }));

  var grid = document.getElementById("projGrid");
  var filterWrap = document.getElementById("filters");
  var loadMoreBtn = document.getElementById("loadMore");
  var STEP = 9, shown = STEP, activeCat = "All";

  CATS.forEach(function (c) {
    var b = document.createElement("button");
    b.textContent = c; if (c === "All") b.classList.add("active");
    b.addEventListener("click", function () {
      activeCat = c; shown = STEP;
      filterWrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      render();
    });
    filterWrap.appendChild(b);
  });

  function filtered() {
    return PROJECTS.filter(function (p) { return activeCat === "All" || p.cat === activeCat; });
  }
  function card(p) {
    var links = (p.links || []).map(function (l) {
      var ext = /^https?:/.test(l[1]);
      return '<a href="' + l[1] + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
        '<i class="fa fa-' + (ext ? "external-link" : "play-circle-o") + '"></i> ' + l[0] + '</a>';
    }).join("");
    return '<article class="proj reveal">' +
      '<div class="proj-img"><span class="proj-cat">' + p.cat + '</span>' +
      '<img loading="lazy" src="' + p.img + '" alt="' + p.t + '" onerror="this.src=\'img/project-bg.png\'"></div>' +
      '<div class="proj-body"><h3>' + p.t + '</h3><div class="date">' + p.date + '</div>' +
      '<p>' + p.d + '</p>' + (links ? '<div class="proj-links">' + links + '</div>' : '') + '</div></article>';
  }
  function render() {
    var list = filtered();
    grid.innerHTML = list.slice(0, shown).map(card).join("");
    loadMoreBtn.style.display = shown >= list.length ? "none" : "";
    observeReveals();
    // reveal these immediately-ish so filtered results don't stay invisible
    requestAnimationFrame(function () {
      grid.querySelectorAll(".reveal").forEach(function (el, i) {
        setTimeout(function () { el.classList.add("in"); }, i * 40);
      });
    });
  }
  loadMoreBtn.addEventListener("click", function () { shown += STEP; render(); });
  render();

  /* ---------- PLOTLY CHARTS ---------- */
  var PLOT = { alt: null, thrust: null, skills: null };

  function themeVals() {
    var cs = getComputedStyle(root);
    return {
      font: cs.getPropertyValue("--text").trim(),
      dim: cs.getPropertyValue("--text-dim").trim(),
      grid: cs.getPropertyValue("--plot-grid").trim(),
      accent: cs.getPropertyValue("--accent").trim(),
      accent2: cs.getPropertyValue("--accent-2").trim()
    };
  }
  function baseLayout(extra) {
    var t = themeVals();
    var L = {
      paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: t.dim, family: "Inter, sans-serif", size: 12 },
      margin: { t: 30, r: 24, b: 48, l: 60 }, showlegend: true,
      legend: { orientation: "h", y: 1.12, x: 0, font: { color: t.dim } },
      hovermode: "x unified"
    };
    for (var k in (extra || {})) L[k] = extra[k];
    return L;
  }
  function axis(title) {
    var t = themeVals();
    return { title: { text: title, font: { color: t.dim } }, gridcolor: t.grid,
      zerolinecolor: t.grid, linecolor: t.grid, tickfont: { color: t.dim } };
  }
  var CFG = { displayModeBar: false, responsive: true };

  // Synthetic-but-representative launch trajectory (13.5s burn, ~9300 ft apogee)
  function launchData() {
    var t = [], alt = [], vel = [];
    var burn = 13.5, apT = 24, land = 95;
    for (var i = 0; i <= land; i++) {
      t.push(i);
      var a;
      if (i <= burn) a = 2100 * Math.pow(i / burn, 1.7);
      else if (i <= apT) { var f = (i - burn) / (apT - burn); a = 2100 + (9300 - 2100) * (1 - Math.pow(1 - f, 2)); }
      else { var f2 = (i - apT) / (land - apT); a = 9300 * (1 - f2) - 400 * Math.sin(f2 * 3); if (a < 0) a = 0; }
      alt.push(Math.max(0, a));
    }
    for (var j = 0; j < alt.length; j++) {
      var prev = j ? alt[j - 1] : 0;
      vel.push((alt[j] - prev));
    }
    return { t: t, alt: alt, vel: vel, burn: burn };
  }
  function drawAlt() {
    var d = launchData(), th = themeVals();
    Plotly.react("plot-alt", [
      { x: d.t, y: d.alt, name: "Altitude (ft)", type: "scatter", mode: "lines",
        line: { color: th.accent, width: 3, shape: "spline" }, fill: "tozeroy",
        fillcolor: "rgba(71,171,236,.12)" },
      { x: d.t, y: d.vel.map(function (v) { return v * 8; }), name: "Velocity (ft/s)", yaxis: "y2",
        type: "scatter", mode: "lines", line: { color: th.accent2, width: 2, dash: "dot" } }
    ], baseLayout({
      xaxis: axis("Time (s)"),
      yaxis: axis("Altitude (ft)"),
      yaxis2: { title: { text: "Velocity (ft/s)", font: { color: th.dim } }, overlaying: "y", side: "right",
        gridcolor: "rgba(0,0,0,0)", tickfont: { color: th.dim }, showgrid: false },
      shapes: [{ type: "line", x0: d.burn, x1: d.burn, y0: 0, y1: 9300, line: { color: th.dim, width: 1, dash: "dash" } }],
      annotations: [{ x: d.burn, y: 9300, text: "burnout 13.5s", showarrow: false, font: { color: th.dim, size: 11 }, xanchor: "left" },
                    { x: 24, y: 9300, text: "apogee ~9,300 ft", showarrow: true, arrowcolor: th.dim, font: { color: th.font, size: 11 }, ay: -28 }]
    }), CFG);
    PLOT.alt = 1;
  }
  // Representative VTF thrust + chamber pressure (>900 lbf, ~500 psi tanks, 8s burn)
  function drawThrust() {
    var t = [], thrust = [], pc = [], burn = 8;
    for (var i = 0; i <= 100; i++) {
      var x = i / 10; t.push(x);
      var base = x < 0.6 ? (x / 0.6) : (x > burn ? Math.max(0, 1 - (x - burn) / 0.5) : 1);
      var noise = 1 + (Math.sin(x * 9) * 0.02);
      thrust.push(Math.max(0, base * 950 * noise));
      pc.push(Math.max(0, base * 500 * (1 + Math.sin(x * 7) * 0.015)));
    }
    var th = themeVals();
    Plotly.react("plot-thrust", [
      { x: t, y: thrust, name: "Thrust (lbf)", type: "scatter", mode: "lines",
        line: { color: th.accent, width: 3 }, fill: "tozeroy", fillcolor: "rgba(71,171,236,.12)" },
      { x: t, y: pc, name: "Chamber P (psi)", yaxis: "y2", type: "scatter", mode: "lines",
        line: { color: "#ff7a59", width: 2 } }
    ], baseLayout({
      xaxis: axis("Time (s)"), yaxis: axis("Thrust (lbf)"),
      yaxis2: { title: { text: "Pressure (psi)", font: { color: th.dim } }, overlaying: "y", side: "right",
        showgrid: false, tickfont: { color: th.dim } }
    }), CFG);
    PLOT.thrust = 1;
  }
  function drawSkills() {
    var th = themeVals();
    Plotly.react("plot-skills", [{
      type: "scatterpolar", r: [90, 88, 85, 85, 75, 65, 90], theta: ["Python", "Avionics/DAQ", "Embedded C/C++", "Test Automation", "Java", "CAD", "Python"],
      fill: "toself", name: "Proficiency", line: { color: th.accent }, fillcolor: "rgba(71,171,236,.25)"
    }], baseLayout({
      showlegend: false,
      polar: { bgcolor: "rgba(0,0,0,0)",
        radialaxis: { visible: true, range: [0, 100], gridcolor: th.grid, tickfont: { color: th.dim }, angle: 90 },
        angularaxis: { gridcolor: th.grid, tickfont: { color: th.font } } }
    }), CFG);
    PLOT.skills = 1;
  }

  function restylePlots() {
    // redraw whichever plots exist so colors match theme.
    // Guard: this can be called from applyTheme() before PLOT is initialized
    // and before Plotly has drawn anything.
    if (typeof PLOT === "undefined" || !PLOT || !window.Plotly) return;
    if (PLOT.alt) drawAlt();
    if (PLOT.thrust) drawThrust();
    if (PLOT.skills) drawSkills();
  }

  // Lazy-load the Plotly library (~3.5MB) only when the Data section is near.
  // This keeps it entirely off the critical path for initial page load.
  var plotlyState = 0; // 0=not loaded, 1=loading, 2=ready
  var plotlyQueue = [];
  function withPlotly(fn) {
    if (plotlyState === 2) { fn(); return; }
    plotlyQueue.push(fn);
    if (plotlyState === 1) return;
    plotlyState = 1;
    var s = document.createElement("script");
    s.src = "https://cdn.plot.ly/plotly-2.32.0.min.js";
    s.charset = "utf-8";
    s.onload = function () { plotlyState = 2; plotlyQueue.forEach(function (f) { f(); }); plotlyQueue = []; };
    s.onerror = function () {
      plotlyState = 0;
      var el = document.getElementById("plot-alt");
      if (el) el.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:2rem">' +
        'Charts couldn\'t load — view the full telemetry via the links below.</p>';
    };
    document.head.appendChild(s);
  }

  // kick off the Plotly fetch a bit before the section is visible, then draw
  var dataObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { withPlotly(drawAlt); dataObs.disconnect(); }
    });
  }, { rootMargin: "300px 0px", threshold: 0 });
  dataObs.observe(document.getElementById("data"));

  // plot tab switching
  document.querySelectorAll(".plot-tabs button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".plot-tabs button").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".plot-panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var key = btn.getAttribute("data-plot");
      document.getElementById("panel-" + key).classList.add("active");
      withPlotly(function () {
        if (key === "alt" && !PLOT.alt) drawAlt();
        if (key === "thrust" && !PLOT.thrust) drawThrust();
        if (key === "skills" && !PLOT.skills) drawSkills();
        // Plotly needs a resize nudge when its container was display:none
        setTimeout(function () { if (window.Plotly) Plotly.Plots.resize("plot-" + key); }, 60);
      });
    });
  });

  /* ---------- SCROLL ROCKET + LAUNCH TIMELINE ---------- */
  // The 🚀 rides a trajectory bar across the bottom in proportion to scroll
  // progress, while a SpaceX-style telemetry HUD ticks through flight events:
  // each event fires as its section reaches the top of the viewport, and a fake
  // T+ mission clock interpolates between the event times.
  (function scrollRocket() {
    var rk = document.getElementById("flying-rocket");
    var track = document.getElementById("launch-track");
    var hud = document.getElementById("launch-hud");
    if (!rk || reduceMotion) return;

    var root = document.documentElement;

    // Flight events pinned to sections, in order, with a plausible T+ time (sec).
    // "at" is resolved to a scroll position on each layout pass.
    var EVENTS = [
      { id: "home",       label: "Liftoff",              t: 0 },
      { id: "about",      label: "Max Q",                t: 72 },   // T+01:12
      { id: "experience", label: "MECO",                 t: 156 },  // T+02:36
      { id: "rocket",     label: "Stage Sep",            t: 162 },  // T+02:42
      { id: "projects",   label: "Stage 2 Ignition",     t: 168 },  // T+02:48
      { id: "contact",    label: "SECO / Payload Insertion", t: 522 } // T+08:42
    ];

    var clockEl = hud ? hud.querySelector(".lh-clock") : null;
    var eventEl = hud ? hud.querySelector(".lh-event") : null;
    var altEl   = hud ? hud.querySelector(".lh-alt") : null;
    var velEl   = hud ? hud.querySelector(".lh-vel") : null;
    var lastLabel = null, lastIdx = -1;

    function fmt(sec) {
      sec = Math.max(0, Math.round(sec));
      var m = Math.floor(sec / 60), s = sec % 60;
      return "T+" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    // emit a small exhaust puff just behind the scroll rocket's current position
    function puff() {
      var r = rk.getBoundingClientRect();
      for (var i = 0; i < 4; i++) {
        var p = document.createElement("div");
        p.className = "rk-puff";
        p.style.left = (r.left + r.width * 0.2 - 4 + (Math.random() * 10 - 5)) + "px";
        p.style.top  = (r.top + r.height * 0.6 + (Math.random() * 8 - 4)) + "px";
        p.style.animationDelay = (i * 0.05) + "s";
        document.body.appendChild(p);
        p.addEventListener("animationend", function () { this.remove(); });
      }
    }
    function stageFX() {
      if (hud) { hud.classList.remove("flash"); void hud.offsetWidth; hud.classList.add("flash"); }
      puff();
    }
    // expose so the boost handler can reuse the puff
    rk._puff = puff;

    // Resolve each event's scroll Y (top of its section) and lay out the ticks.
    var scrollable = 1;
    function measure() {
      scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
      EVENTS.forEach(function (e) {
        var el = document.getElementById(e.id);
        e.y = el ? Math.min(el.offsetTop, scrollable) : 0;
        e.p = e.y / scrollable;              // 0..1 position along the track
      });
      // last event sits at the very end of the page
      EVENTS[EVENTS.length - 1].p = 1;
      EVENTS[EVENTS.length - 1].y = scrollable;
      if (track) layoutTicks();
      buildPath();
    }

    function layoutTicks() {
      // remove old ticks (keep the .fill), then add one per event
      Array.prototype.slice.call(track.querySelectorAll(".tick")).forEach(function (t) { t.remove(); });
      EVENTS.forEach(function (e) {
        var tick = document.createElement("div");
        tick.className = "tick";
        tick.style.left = (e.p * 100).toFixed(2) + "%";
        tick.title = e.label;
        e.tick = tick;
        track.appendChild(tick);
      });
    }

    function update() {
      var y = window.scrollY || root.scrollTop || 0;
      var progress = y / scrollable;
      if (progress < 0) progress = 0; else if (progress > 1) progress = 1;
      root.style.setProperty("--rk-progress", progress.toFixed(4));

      // find current event (last one whose position we've passed)
      var idx = 0;
      for (var i = 0; i < EVENTS.length; i++) {
        if (progress + 1e-4 >= EVENTS[i].p) idx = i;
      }
      // interpolate the T+ clock between this event and the next
      var cur = EVENTS[idx], nxt = EVENTS[idx + 1];
      var tsec = cur.t;
      if (nxt && nxt.p > cur.p) {
        var frac = (progress - cur.p) / (nxt.p - cur.p);
        if (frac < 0) frac = 0; else if (frac > 1) frac = 1;
        tsec = cur.t + (nxt.t - cur.t) * frac;
      }
      if (clockEl) clockEl.textContent = fmt(tsec);
      if (eventEl && cur.label !== lastLabel) { eventEl.textContent = cur.label; lastLabel = cur.label; }

      // telemetry readout: fake altitude (km) & velocity (m/s) that climb with progress
      if (altEl) altEl.innerHTML = Math.round(progress * 210) + " km";
      if (velEl) velEl.innerHTML = (Math.round(progress * 7800 / 10) * 10).toLocaleString() + " m/s";

      // fire stage FX (puff + chip flash) when we cross into a NEW event (mid-flight only)
      if (idx !== lastIdx) {
        if (lastIdx !== -1 && idx > lastIdx && idx > 0 && idx < EVENTS.length) stageFX();
        lastIdx = idx;
      }

      // mark ticks passed
      EVENTS.forEach(function (e) {
        if (e.tick) e.tick.classList.toggle("passed", progress + 1e-4 >= e.p);
      });

      drawTrajectory(progress);
    }

    /* ---- self-drawing trajectory arc down the page ---- */
    var svg = document.getElementById("trajectory");
    var pathEl = svg ? svg.querySelector("path") : null;
    var pathLen = 0;
    // resolve theme colors into the gradient stops (SVG stops don't reliably
    // read CSS custom properties), and refresh them when the theme changes
    function paintGrad() {
      if (!svg) return;
      var cs = getComputedStyle(root);
      var stops = svg.querySelectorAll("#trajGrad stop");
      if (stops[0]) stops[0].setAttribute("stop-color", cs.getPropertyValue("--accent").trim() || "#47abec");
      if (stops[1]) stops[1].setAttribute("stop-color", cs.getPropertyValue("--accent-2").trim() || "#7c5cff");
    }
    paintGrad();
    if (toggle) toggle.addEventListener("click", function () { setTimeout(paintGrad, 50); });
    var docH = 1;
    function buildPath() {
      if (!svg || !pathEl) return;
      var w = window.innerWidth, h = root.scrollHeight;
      docH = h;
      // path is authored in full-document coordinates; the fixed SVG shows a
      // viewport-sized slice of it (viewBox is scrolled in drawTrajectory).
      svg.setAttribute("width", w); svg.setAttribute("height", window.innerHeight);
      // gentle S-curve weaving between the sides as it descends the page
      var d = "M " + (w * 0.12).toFixed(0) + " 0";
      var steps = 8;
      for (var i = 1; i <= steps; i++) {
        var y = h * (i / steps);
        var x = w * (0.5 + 0.36 * Math.sin(i * 1.15));
        var cy = h * ((i - 0.5) / steps);
        var cx = w * (0.5 + 0.5 * Math.sin((i - 0.6) * 1.15));
        d += " Q " + cx.toFixed(0) + " " + cy.toFixed(0) + " " + x.toFixed(0) + " " + y.toFixed(0);
      }
      pathEl.setAttribute("d", d);
      pathLen = pathEl.getTotalLength();
      pathEl.style.strokeDasharray = pathLen;
      pathEl.style.strokeDashoffset = pathLen;
    }
    function drawTrajectory(progress) {
      if (!pathEl || !pathLen) return;
      // scroll the viewBox so the fixed SVG reveals the arc at our scroll depth
      var y = window.scrollY || root.scrollTop || 0;
      svg.setAttribute("viewBox", "0 " + y.toFixed(0) + " " + window.innerWidth + " " + window.innerHeight);
      // stroke the path in proportion to scroll progress
      pathEl.style.strokeDashoffset = (pathLen * (1 - progress)).toFixed(1);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { update(); ticking = false; });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { measure(); update(); });
    // re-measure once big media (hero video, images) settle the layout
    window.addEventListener("load", function () { measure(); update(); });

    // click the scroll rocket → quick barrel-roll + boost puffs
    var boosting = false;
    rk.addEventListener("click", function () {
      if (boosting) return;
      boosting = true;
      rk.classList.remove("boost"); void rk.offsetWidth; rk.classList.add("boost");
      var n = 0, iv = setInterval(function () { rk._puff(); if (++n >= 5) clearInterval(iv); }, 70);
      setTimeout(function () { rk.classList.remove("boost"); boosting = false; }, 750);
    });

    measure();
    update();
  })();

  /* ---------- LAZY-PLAY BACKGROUND VIDEOS ---------- */
  // Ambient videos marked data-lazy-video only load & play while on screen,
  // and pause when scrolled away, so they never fight the initial page load.
  (function lazyVideos() {
    var vids = document.querySelectorAll("video[data-lazy-video]");
    if (!vids.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { rootMargin: "200px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  })();

  /* ---------- LAUNCH SEQUENCE (easter egg) ---------- */
  // Triple-click the brand, or type "liftoff", to run a T-10 countdown that ends
  // with the rocket climbing across the screen amid confetti and a screen shake.
  (function launchSequence() {
    var overlay = document.getElementById("countdown");
    var rocket = document.getElementById("launch-rocket");
    if (!overlay || !rocket) return;
    var numEl = overlay.querySelector(".cd-num");
    var statusEl = overlay.querySelector(".cd-status");
    var ringEl = overlay.querySelector(".cd-ring > i");
    var running = false, timers = [], audioCtx = null;

    var STATUS = {
      10: "Terminal Count", 6: "Startup", 3: "Ignition Sequence Start", 1: "Liftoff Commit"
    };

    function beep(freq, dur, vol) {
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = freq;
        g.gain.value = vol == null ? 0.05 : vol;
        o.connect(g); g.connect(audioCtx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (dur || 0.12));
        o.stop(audioCtx.currentTime + (dur || 0.12));
      } catch (e) {}
    }

    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function abort() {
      clearTimers();
      overlay.classList.remove("show");
      rocket.classList.remove("go");
      document.body.classList.remove("launching");
      running = false;
    }

    function confettiBurst() {
      var colors = ["#47abec", "#7c5cff", "#39d98a", "#ffd447", "#ff6bb5"];
      for (var i = 0; i < 90; i++) {
        var c = document.createElement("div");
        c.className = "cd-confetti";
        c.style.left = (Math.random() * 100) + "vw";
        c.style.background = colors[i % colors.length];
        c.style.animationDuration = (1 + Math.random() * 1.2) + "s";
        c.style.animationDelay = (Math.random() * 0.25) + "s";
        document.body.appendChild(c);
        c.addEventListener("animationend", function () { this.remove(); });
      }
    }

    function ignite() {
      overlay.classList.remove("show");
      document.body.classList.add("launching");
      rocket.classList.remove("go"); void rocket.offsetWidth; rocket.classList.add("go");
      beep(880, 0.5, 0.06);
      confettiBurst();
      timers.push(setTimeout(function () {
        document.body.classList.remove("launching");
        running = false;
      }, 2600));
    }

    function run() {
      if (running) return;
      running = true;
      overlay.classList.add("show");
      var n = 10;
      function step() {
        if (n > 0) {
          numEl.textContent = n;
          numEl.classList.remove("go");
          numEl.classList.remove("tick"); void numEl.offsetWidth; numEl.classList.add("tick");
          if (STATUS[n]) statusEl.textContent = STATUS[n];
          ringEl.style.width = ((10 - n + 1) / 10 * 100) + "%";
          beep(n <= 3 ? 660 : 440, 0.1, 0.045);
          n--;
          timers.push(setTimeout(step, 1000));
        } else {
          statusEl.textContent = "We have liftoff";
          numEl.textContent = "GO";
          numEl.classList.add("go");
          beep(720, 0.18, 0.06);
          timers.push(setTimeout(ignite, 650));
        }
      }
      step();
    }

    // trigger 1: triple-click the brand
    var brand = document.querySelector(".brand");
    if (brand) {
      var clicks = 0, clickTimer = null;
      brand.addEventListener("click", function (e) {
        clicks++;
        if (clicks >= 3) {
          e.preventDefault();
          clicks = 0; clearTimeout(clickTimer);
          run();
          return;
        }
        clearTimeout(clickTimer);
        clickTimer = setTimeout(function () { clicks = 0; }, 600);
      });
    }

    // trigger 2: type "liftoff" anywhere
    var typed = "";
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { abort(); return; }
      if (e.key && e.key.length === 1) {
        typed = (typed + e.key.toLowerCase()).slice(-7);
        if (typed.indexOf("liftoff") !== -1) { typed = ""; run(); }
      }
    });

    // mobile: no ESC key — tap the countdown overlay to abort
    overlay.addEventListener("click", function () { if (running) abort(); });
  })();

  /* ---------- SHARED TOAST (easter eggs) ---------- */
  var eggToast = (function () {
    var el = document.getElementById("egg-toast");
    var hideTimer = null;
    return function (html, ms) {
      if (!el) return;
      el.innerHTML = html;
      el.classList.add("show");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { el.classList.remove("show"); }, ms || 4200);
    };
  })();

  /* ---------- MAGNETIC BUTTONS ---------- */
  // Hero buttons subtly pull toward the cursor as it approaches. Pointer-only.
  (function magneticButtons() {
    if (reduceMotion) return;
    if (!window.matchMedia || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    document.querySelectorAll(".hero-cta .btn").forEach(function (btn) {
      var strength = 0.35;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (dx * strength).toFixed(1) + "px," + (dy * strength).toFixed(1) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  })();

  /* ---------- KONAMI SCRUB (easter egg) ---------- */
  (function konamiScrub() {
    var flash = document.getElementById("scrub-flash");
    if (!flash) return;
    var SEQ = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    var pos = 0;
    document.addEventListener("keydown", function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = (k === SEQ[pos]) ? pos + 1 : (k === SEQ[0] ? 1 : 0);
      if (pos === SEQ.length) {
        pos = 0;
        flash.classList.add("show");
        if (!reduceMotion) document.body.classList.add("scrubbed");
        setTimeout(function () {
          flash.classList.remove("show");
          document.body.classList.remove("scrubbed");
        }, 1900);
      }
    });
  })();

  /* ---------- KEYWORD JUMPS (easter egg) ---------- */
  // Type an event name to jump/pulse the matching section + HUD.
  (function keywordJumps() {
    var MAP = {
      apogee: "rocket", meco: "experience", seco: "contact",
      maxq: "about", stagesep: "rocket"
    };
    var buf = "";
    document.addEventListener("keydown", function (e) {
      if (!e.key || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).replace(/[^a-z]/g, "").slice(-9);
      for (var word in MAP) {
        if (buf.indexOf(word) !== -1) {
          var sec = document.getElementById(MAP[word]);
          if (sec) sec.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
          var hud = document.getElementById("launch-hud");
          if (hud) { hud.classList.remove("flash"); void hud.offsetWidth; hud.classList.add("flash"); }
          buf = "";
          break;
        }
      }
    });
  })();

  /* ---------- THE MARTIAN + STRUTS (easter eggs) ---------- */
  (function quoteEggs() {
    var buf = "";
    document.addEventListener("keydown", function (e) {
      if (!e.key || e.key.length !== 1) return;
      buf = (buf + e.key.toLowerCase()).replace(/[^a-z]/g, "").slice(-12);
      if (buf.indexOf("martian") !== -1) {
        buf = "";
        eggToast('<span class="et-mono">🥔 Mark Watney:</span> “I’m going to have to science the sh__ out of this.”');
      } else if (buf.indexOf("struts") !== -1) {
        buf = "";
        eggToast('<span class="et-mono">Disclaimer:</span> No struts were harmed in the making of this animation. (The real ones… less lucky.)');
      }
    });
  })();

  /* ---------- IDLE ORBIT SATELLITE (easter egg) ---------- */
  (function idleOrbit() {
    var sat = document.getElementById("satellite");
    if (!sat || reduceMotion) return;
    var timer = null, flying = false;
    function arm() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (flying) return;
        flying = true;
        sat.classList.remove("go"); void sat.offsetWidth; sat.classList.add("go");
        sat.addEventListener("animationend", function once() {
          sat.classList.remove("go"); flying = false;
          sat.removeEventListener("animationend", once);
          arm();
        });
      }, 30000);
    }
    ["mousemove","scroll","keydown","touchstart","click"].forEach(function (ev) {
      window.addEventListener(ev, arm, { passive: true });
    });
    arm();
  })();

  /* ---------- EASTER-EGG CHEATSHEET ---------- */
  (function eggSheet() {
    var btn = document.getElementById("eggToggle");
    var sheet = document.getElementById("egg-sheet");
    if (!btn || !sheet) return;
    function open() {
      sheet.hidden = false;
      requestAnimationFrame(function () { sheet.classList.add("in"); });
      btn.classList.add("open"); btn.setAttribute("aria-expanded", "true");
    }
    function close() {
      sheet.hidden = true; sheet.classList.remove("in");
      btn.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (sheet.hidden) open(); else close();
    });
    // click outside / Escape closes it
    document.addEventListener("click", function (e) {
      if (!sheet.hidden && !sheet.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  })();

  /* ---------- CONSOLE GREETING (easter egg) ---------- */
  (function consoleGreeting() {
    try {
      var big = "font-size:13px;font-family:monospace;color:#47abec;";
      console.log("%c" +
        "        /\\\n" +
        "       /  \\\n" +
        "      |    |\n" +
        "      | NC |\n" +
        "      |    |\n" +
        "     /|    |\\\n" +
        "    /_|____|_\\\n" +
        "       /\\\n" +
        "      /  \\\n", big);
      console.log("%cLooks like you know your way around a console. 🚀", "font-size:14px;font-weight:bold;color:#7c5cff;");
      console.log("%cHidden around here: triple-click the logo (or type \"liftoff\") to launch · Konami code to scrub · type \"apogee\", \"meco\", \"martian\", or \"struts\" · click the little rocket · leave it idle a while.", "font-size:12px;color:#9aa6bd;");
      console.log("%cLet's talk: nchennoju@gmail.com", "font-size:12px;color:#47abec;");
    } catch (e) {}
  })();

  /* ---------- MISC ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
  observeReveals();
  document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });
  updateParallax();

  // Dismiss the preloader as soon as the page is interactive. We do NOT wait
  // for window.load, because that blocks on every subresource (background
  // videos, the YouTube iframe, etc.) and would leave the spinner up needlessly.
  function hidePreloader() {
    var pre = document.getElementById("preloader");
    if (!pre || pre.classList.contains("done")) return;
    pre.classList.add("done");
    setTimeout(function () { if (pre.parentNode) pre.remove(); }, 650);
  }
  if (document.readyState !== "loading") {
    hidePreloader();
  } else {
    document.addEventListener("DOMContentLoaded", hidePreloader);
  }
  // hard fallback: never let the spinner linger no matter what
  setTimeout(hidePreloader, 2000);
})();
