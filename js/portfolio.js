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
    var start = 0, dur = 1400, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = start + (target - start) * eased;
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
      links: [["Ford's Garage", "cards/bdaycard.html"], ["Barbie Deluxe", "cards/gpt2.html"]] }
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

  // lazy-init plots when the Data section scrolls in
  var dataObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { drawAlt(); dataObs.disconnect(); }
    });
  }, { threshold: 0.15 });
  dataObs.observe(document.getElementById("data"));

  // plot tab switching
  document.querySelectorAll(".plot-tabs button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".plot-tabs button").forEach(function (b) { b.classList.remove("active"); });
      document.querySelectorAll(".plot-panel").forEach(function (p) { p.classList.remove("active"); });
      btn.classList.add("active");
      var key = btn.getAttribute("data-plot");
      document.getElementById("panel-" + key).classList.add("active");
      if (key === "alt" && !PLOT.alt) drawAlt();
      if (key === "thrust" && !PLOT.thrust) drawThrust();
      if (key === "skills" && !PLOT.skills) drawSkills();
      // Plotly needs a resize nudge when its container was display:none
      var id = "plot-" + key;
      setTimeout(function () { if (window.Plotly) Plotly.Plots.resize(id); }, 60);
    });
  });

  /* ---------- FLYING ROCKET ---------- */
  (function flyingRocket() {
    var rk = document.getElementById("flying-rocket");
    if (!rk || reduceMotion) return;

    function launch() {
      // The 🚀 glyph points up-and-to-the-right, so fly it that way:
      // enter from the lower-left, climb out through the upper-right.
      var startY = (78 + Math.random() * 20).toFixed(0);      // 78–98vh (low)
      var climb  = 78 + Math.random() * 34;                   // vertical rise (vh)
      var endY   = (startY - climb).toFixed(0);               // ends high / above top
      var dur = (5.5 + Math.random() * 3).toFixed(1);         // 5.5–8.5s
      rk.style.setProperty("--rk-x0", "-14vw");
      rk.style.setProperty("--rk-x1", "114vw");
      rk.style.setProperty("--rk-y0", startY + "vh");
      rk.style.setProperty("--rk-y1", endY + "vh");
      rk.style.setProperty("--rk-rot", "0deg");               // glyph is already angled
      rk.style.setProperty("--rk-dur", dur + "s");
      rk.classList.remove("fly");
      void rk.offsetWidth;   // reflow so the animation can restart
      rk.classList.add("fly");
    }
    rk.addEventListener("animationend", function () { rk.classList.remove("fly"); });

    function schedule() {
      var wait = 14000 + Math.random() * 16000;   // every ~14–30s
      setTimeout(function () {
        if (!document.hidden) launch();
        schedule();
      }, wait);
    }
    setTimeout(launch, 2600);   // first flyby shortly after load
    schedule();

    // fun: click the brand dot to launch on demand
    var dot = document.querySelector(".brand .dot");
    if (dot) { dot.style.cursor = "pointer"; dot.parentElement.addEventListener("dblclick", launch); }
  })();

  /* ---------- MISC ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
  observeReveals();
  document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });
  updateParallax();

  window.addEventListener("load", function () {
    setTimeout(function () {
      var pre = document.getElementById("preloader");
      pre.classList.add("done");
      setTimeout(function () { pre.remove(); }, 650);
    }, 250);
  });
})();
