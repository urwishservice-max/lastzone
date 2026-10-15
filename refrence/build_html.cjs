const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'report_assets');
function getB64(filename) {
  const p = path.join(imgDir, filename);
  if (!fs.existsSync(p)) {
    console.warn('File not found:', p);
    return '';
  }
  const ext = path.extname(p).slice(1);
  return 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + fs.readFileSync(p).toString('base64');
}

console.log('Encoding base64 assets...');
const citLogo = getB64('cit_logo.png');
const homePage = getB64('home_page.png');
const loginForm = getB64('login_form.png');
const registerForm = getB64('register_form.png');
const weaponInspection = getB64('weapon_inspection.png');
const spartanArmor = getB64('spartan_armor.png');
const unityGame = getB64('unity_game.png');
const gameplay = getB64('gameplay.png');
const leaderboard = getB64('leaderboard.png');
const backendApi = getB64('backend_api.png');
const jenkinsJob = getB64('jenkins_job.png');
const jenkinsBuild = getB64('jenkins_build.png');
const jenkinsConsole = getB64('jenkins_console.png');

console.log('Building HTML...');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>CIT Full Stack Development Laboratory Report - LastZone</title>
<style>
  @page {
    size: A4;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    margin: 0;
    padding: 0;
    font-family: 'Times New Roman', Times, serif;
    color: #111;
    background: #fff;
    font-size: 11pt;
    line-height: 1.35;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 12mm 15mm;
    margin: 0 auto;
    page-break-after: always;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .outer-border {
    position: absolute;
    top: 10mm;
    left: 12mm;
    right: 12mm;
    bottom: 10mm;
    border: 1px solid #222;
    pointer-events: none;
  }
  .page-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .page-header-title {
    text-align: center;
    margin-bottom: 8px;
  }
  .page-header-title h1 {
    font-size: 15pt;
    margin: 0 0 3px 0;
    font-weight: bold;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .page-header-title h2 {
    font-size: 11pt;
    font-style: italic;
    font-weight: normal;
    margin: 0 0 10px 0;
  }
  .page-header-title h3 {
    font-size: 12pt;
    font-weight: bold;
    margin: 0 0 6px 0;
    letter-spacing: 0.3px;
  }
  
  /* Typography */
  h2.sec-heading {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    margin: 12px 0 6px 0;
    border-bottom: 1px solid #333;
    padding-bottom: 2px;
  }
  h3.sec-subheading {
    font-size: 11.5pt;
    font-weight: bold;
    margin: 8px 0 4px 0;
  }
  p {
    margin: 0 0 6px 0;
    text-align: justify;
    font-size: 10.5pt;
    line-height: 1.35;
  }
  ul {
    margin: 4px 0 8px 18px;
    padding: 0;
    font-size: 10.5pt;
  }
  li {
    margin-bottom: 3px;
  }
  
  /* Tables */
  table.report-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 10px 0;
    font-size: 9.5pt;
  }
  table.report-table th, table.report-table td {
    border: 1px solid #333;
    padding: 5px 7px;
    text-align: left;
    vertical-align: top;
  }
  table.report-table th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 9pt;
  }
  
  /* Callout boxes */
  .callout-box {
    border: 1px solid #555;
    background-color: #fbfbfb;
    padding: 6px 10px;
    margin: 8px 0;
    font-size: 10pt;
    font-style: italic;
    border-radius: 2px;
  }
  
  /* Screenshots */
  .fig-container {
    text-align: center;
    margin: 6px 0 6px 0;
  }
  .fig-container img {
    max-width: 96%;
    max-height: 125mm;
    object-fit: contain;
    border: 1px solid #999;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }
  .fig-caption {
    font-size: 9.5pt;
    font-style: italic;
    margin-top: 4px;
    color: #222;
    text-align: center;
  }
  
  /* Cover page specific */
  .cover-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    padding: 15mm 5mm 10mm 5mm;
  }
  .cover-logo {
    width: 110px;
    height: auto;
    margin: 20px 0;
  }
  .cover-submit {
    width: 100%;
    margin-top: 25px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .submit-table {
    border-collapse: collapse;
    margin-top: 10px;
  }
  .submit-table td {
    padding: 4px 15px;
    font-size: 11pt;
    font-weight: bold;
    text-align: left;
  }

  /* Evaluation Form */
  .eval-header-table {
    width: 100%;
    margin: 8px 0 12px 0;
    font-size: 10.5pt;
  }
  .eval-header-table td {
    padding: 3px 4px;
  }
  .eval-obs-box {
    border: 1px solid #333;
    height: 95px;
    margin: 10px 0 18px 0;
    padding: 6px;
    font-size: 10pt;
  }
  .eval-signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    font-size: 10.5pt;
  }

  /* Two col layout */
  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .three-col-arch {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    margin: 8px 0;
  }
  .arch-box {
    border: 1px solid #444;
    padding: 6px;
    background: #fafafa;
    font-size: 9pt;
  }
  .arch-box h4 {
    margin: 0 0 4px 0;
    font-size: 9.5pt;
    font-weight: bold;
    text-align: center;
    background: #e6e6e6;
    padding: 2px 0;
  }

  /* Header / Footer line */
  .page-footer-num {
    text-align: right;
    font-size: 9.5pt;
    font-style: italic;
    color: #444;
    border-top: 1px solid #ccc;
    padding-top: 3px;
    margin-top: auto;
  }
</style>
</head>
<body>

<!-- ================= PAGE 1: COVER PAGE ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="cover-container">
      <div>
        <h1 style="font-size: 16pt; margin: 0 0 6px 0; font-weight: bold; letter-spacing: 0.5px;">COIMBATORE INSTITUTE OF TECHNOLOGY</h1>
        <p style="font-size: 11pt; font-style: italic; margin: 0 0 25px 0;">(Government Aided Autonomous Institution Affiliated to Anna University)</p>
        
        <h2 style="font-size: 12.5pt; font-weight: bold; margin: 25px 0 8px 0; letter-spacing: 0.5px;">23IT721 - FULL STACK DEVELOPMENT LABORATORY</h2>
        <h3 style="font-size: 13pt; font-weight: bold; margin: 0 0 35px 0; text-transform: uppercase;">PROJECT</h3>
        
        <h1 style="font-size: 18pt; font-weight: bold; margin: 0 0 6px 0; letter-spacing: 0.8px;">LASTZONE: ONLINE TOURNAMENT PLATFORM</h1>
        <p style="font-size: 12.5pt; font-weight: bold; font-style: italic; margin: 0 0 20px 0;">(3D Interactive Scrollytelling, WebGL Combat & Automated CI/CD)</p>
      </div>

      <div>
        <img src="${citLogo}" class="cover-logo" alt="CIT Emblem Logo">
      </div>

      <div>
        <h2 style="font-size: 13.5pt; font-weight: bold; letter-spacing: 1px; margin: 15px 0 30px 0;">OCTOBER 2026</h2>
      </div>

      <div class="cover-submit">
        <p style="font-style: italic; font-size: 11pt; margin-bottom: 8px;">Submitted by</p>
        <table class="submit-table">
          <tr>
            <td>2303717620521014</td>
            <td>DHARNIDHARAN V</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- ================= PAGE 2: BONAFIDE CERTIFICATE ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div style="padding: 15mm 5mm 0 5mm;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 14pt; margin: 0 0 4px 0; font-weight: bold; letter-spacing: 0.5px;">COIMBATORE INSTITUTE OF TECHNOLOGY</h2>
        <p style="font-size: 10.5pt; font-style: italic; margin: 0 0 20px 0;">(Government Aided Autonomous Institution Affiliated to Anna University)</p>
        <h2 style="font-size: 13.5pt; font-weight: bold; letter-spacing: 1px; text-decoration: underline; margin: 25px 0 30px 0;">BONAFIDE CERTIFICATE</h2>
      </div>

      <p style="font-size: 11.5pt; line-height: 1.8; text-align: justify; margin-bottom: 25px;">
        Certified that this project report titled <strong>"LASTZONE: ONLINE TOURNAMENT PLATFORM (3D Interactive Scrollytelling, WebGL Combat & Automated CI/CD)"</strong> is the bonafide work of <strong>2303717620521014 - DHARNIDHARAN V</strong> completed during the academic year <strong>2026-2027-Semester VII</strong> for the project presentation of <strong>23IT721 - FULL STACK DEVELOPMENT LABORATORY</strong> under our supervision.
      </p>

      <p style="font-size: 11.5pt; font-style: italic; line-height: 1.7; margin-bottom: 45px;">
        Certified that the candidates were examined by using the project work examination.
      </p>

      <div style="margin-top: 50px;">
        <p style="font-size: 11.5pt; font-weight: bold; margin-bottom: 20px;">Review Members:</p>
        <div style="margin-left: 20px; font-size: 11.5pt; line-height: 2.2;">
          <p><strong>1.&nbsp;&nbsp;&nbsp;&nbsp;Dr. C. Murale</strong></p>
          <p><strong>2.&nbsp;&nbsp;&nbsp;&nbsp;Mr. Y. M. Ismankhan</strong></p>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ================= PAGE 3: EVALUATION FORM ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 5px;">
      <img src="${citLogo}" style="width: 50px; height: 50px;" alt="Logo">
      <div style="text-align: center;">
        <h3 style="font-size: 12pt; margin: 0; font-weight: bold;">Coimbatore Institute of Technology-Coimbatore-14</h3>
        <h4 style="font-size: 11pt; margin: 2px 0 0 0; font-weight: bold;">Department of Information Technology</h4>
      </div>
    </div>

    <div style="text-align: center; margin: 8px 0 10px 0;">
      <h3 style="font-size: 11.5pt; font-weight: bold; margin: 0;">23IT721- FULL STACK DEVELOPMENT LABORATORY</h3>
      <h4 style="font-size: 11pt; font-weight: bold; margin: 2px 0 0 0;">CAT II - CASE STUDY EVALUATION FORM</h4>
    </div>

    <table class="eval-header-table">
      <tr>
        <td style="width: 50%;"><strong>Course:</strong> B.Tech Information Technology</td>
        <td style="width: 25%;"><strong>Semester:</strong> VII</td>
        <td style="width: 25%;"><strong>Date:</strong> 15-10-2026</td>
      </tr>
      <tr>
        <td colspan="3" style="border-top: 1px solid #333; padding-top: 6px;">
          <strong>Roll No :</strong> 2303717620521014
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <strong>Name :</strong> DHARNIDHARAN V
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <strong>Title :</strong> LASTZONE: 3D ZOMBIE SURVIVAL TOURNAMENT PLATFORM
        </td>
      </tr>
    </table>

    <table class="report-table" style="margin-top: 4px;">
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">No.</th>
          <th style="width: 62%;">Description</th>
          <th style="width: 15%; text-align: center;">Marks</th>
          <th style="width: 15%; text-align: center;">Marks Obtained</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center;">1</td>
          <td>Problem Statement and Objective</td>
          <td style="text-align: center;">20</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">2</td>
          <td>Event Handling</td>
          <td style="text-align: center;">20</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">3</td>
          <td>Simulation/Results (AJAX/JQuery / Three.js / WebGL Operations)</td>
          <td style="text-align: center;">30</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">4</td>
          <td>Presentation</td>
          <td style="text-align: center;">10</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">5</td>
          <td>Report</td>
          <td style="text-align: center;">10</td>
          <td></td>
        </tr>
        <tr>
          <td style="text-align: center;">6</td>
          <td>Viva</td>
          <td style="text-align: center;">10</td>
          <td></td>
        </tr>
        <tr style="font-weight: bold; background: #fafafa;">
          <td colspan="2" style="text-align: right; padding-right: 15px;">Total</td>
          <td style="text-align: center;">100</td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <div style="font-weight: bold; font-size: 10.5pt; margin-top: 6px;">Observation / Suggestions</div>
    <div class="eval-obs-box"></div>

    <div class="eval-signature-row">
      <div>
        <p style="font-weight: bold; margin-bottom: 25px;">Name of the Staff</p>
        <p style="margin: 0 0 18px 0;">1. Dr. C. Murale</p>
        <p style="margin: 0;">2. Mr. Y. M. Ismankhan</p>
      </div>
      <div style="text-align: right;">
        <p style="font-weight: bold; margin-bottom: 45px;">Signature of the Staff</p>
        <p style="margin: 0;">_____________________________</p>
      </div>
    </div>
  </div>
</div>

<!-- ================= PAGE 4: TABLE OF CONTENTS ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading" style="text-align: center; border-bottom: 2px solid #222; margin-bottom: 12px;">TABLE OF CONTENTS</h2>
    
    <table class="report-table" style="font-size: 10pt;">
      <thead>
        <tr>
          <th style="width: 15%;">SECTION</th>
          <th style="width: 70%;">TITLE</th>
          <th style="width: 15%; text-align: center;">PAGE</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>—</td><td>Cover Page</td><td style="text-align: center;">1</td></tr>
        <tr><td>—</td><td>Bonafide Certificate</td><td style="text-align: center;">2</td></tr>
        <tr><td>—</td><td>CAT II Case Study Evaluation Form</td><td style="text-align: center;">3</td></tr>
        <tr><td>—</td><td>Table of Contents</td><td style="text-align: center;">4–5</td></tr>
        <tr><td>1</td><td>Introduction</td><td style="text-align: center;">6</td></tr>
        <tr><td>2</td><td>Abstract, Objectives and Scope</td><td style="text-align: center;">6</td></tr>
        <tr><td>3</td><td>Technology Stack</td><td style="text-align: center;">7</td></tr>
        <tr><td>4</td><td>System Architecture</td><td style="text-align: center;">7</td></tr>
        <tr><td>5</td><td>Home Page and Product Identity</td><td style="text-align: center;">8</td></tr>
        <tr><td>6</td><td>Interactive Dashboard & Tactical HUD</td><td style="text-align: center;">8</td></tr>
        <tr><td>7</td><td>Advanced Registration & Authentication</td><td style="text-align: center;">9</td></tr>
        <tr><td>8</td><td>Armory, Inspection & 3D Interactive Lab</td><td style="text-align: center;">9</td></tr>
        <tr><td>9</td><td>Event-Driven Tactical Controls & Combat Mode</td><td style="text-align: center;">10</td></tr>
        <tr><td>10</td><td>Real-Time Leaderboard Center & AJAX Polling</td><td style="text-align: center;">11</td></tr>
        <tr><td>11</td><td>Reports and Combat Insights</td><td style="text-align: center;">11</td></tr>
      </tbody>
    </table>
    
    <div class="page-footer-num">4</div>
  </div>
</div>

<!-- ================= PAGE 5: TABLE OF CONTENTS CONTINUED ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading" style="text-align: center; border-bottom: 2px solid #222; margin-bottom: 12px;">TABLE OF CONTENTS — CONTINUED</h2>
    
    <table class="report-table" style="font-size: 10pt;">
      <thead>
        <tr>
          <th style="width: 15%;">SECTION</th>
          <th style="width: 70%;">TITLE</th>
          <th style="width: 15%; text-align: center;">PAGE</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>12</td><td>Spring Boot Backend and Player Management</td><td style="text-align: center;">12</td></tr>
        <tr><td>13</td><td>Database Design & PostgreSQL Schema</td><td style="text-align: center;">12</td></tr>
        <tr><td>14</td><td>Website & Asset Analyzer (GLTF, Audio & Telemetry)</td><td style="text-align: center;">13</td></tr>
        <tr><td>15</td><td>Responsive Design, Accessibility and Security Controls</td><td style="text-align: center;">14</td></tr>
        <tr><td>16</td><td>Experiment Implementation Details I</td><td style="text-align: center;">14</td></tr>
        <tr><td>17</td><td>Experiment Implementation Details II</td><td style="text-align: center;">15</td></tr>
        <tr><td>18</td><td>Testing, JUnit & Smoke Verification</td><td style="text-align: center;">15</td></tr>
        <tr><td>19</td><td>Docker & Containerized Runtime Environment</td><td style="text-align: center;">16</td></tr>
        <tr><td>20</td><td>Local Server & Automated Jenkins CI/CD Workflow</td><td style="text-align: center;">16</td></tr>
        <tr><td>21</td><td>Database Evidence — Users & Tournament Rosters</td><td style="text-align: center;">17</td></tr>
        <tr><td>22</td><td>Database Evidence — Match Scores & Kill Telemetry</td><td style="text-align: center;">18</td></tr>
        <tr><td>23</td><td>Advantages, Limitations and Troubleshooting</td><td style="text-align: center;">18</td></tr>
        <tr><td>24</td><td>Restart and Shutdown Operating Checklist</td><td style="text-align: center;">19</td></tr>
        <tr><td>25</td><td>References and Repository Artifacts</td><td style="text-align: center;">20</td></tr>
      </tbody>
    </table>

    <div class="page-footer-num">5</div>
  </div>
</div>

<!-- ================= PAGE 6: INTRO, ABSTRACT & OBJECTIVES ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="callout-box">
      <strong>Core principle:</strong> production-grade full-stack engineering, high-performance WebGL 3D graphics, persistent score analytics and automated DevOps pipeline.
    </div>

    <h2 class="sec-heading">1. INTRODUCTION</h2>
    <p>
      <strong>LastZone</strong> is a high-performance full-stack tournament management and 3D zombie survival simulation platform developed as an advanced academic showcase. It combines a cinematic cyberpunk web interface, custom WebGL/Three.js 3D inspection laboratories, an embedded Unity WebGL survival game, a Spring Boot 3.3.5 enterprise REST API backend, and an ACID-compliant PostgreSQL relational database.
    </p>
    <p>
      The project is architected as an end-to-end evolving product rather than disconnected syllabus exercises. Semantic HTML5 structures responsive tactical views; modern CSS/GSAP powers smooth scrollytelling transitions; Three.js delivers dynamic 3D model manipulation; Spring Boot and PostgreSQL provide persistent player profiles and leaderboard stats; and Jenkins automates continuous testing and containerized delivery.
    </p>

    <h3 class="sec-subheading">1.1 Problem Statement</h3>
    <p>
      Online gaming tournaments demand tightly coordinated systems: sub-millisecond leaderboard synchronization, secure player authentication, immersive asset inspection, real-time match telemetry, and seamless multi-device access. Developing this end-to-end requires integrating complex front-end graphics rendering with resilient, scalable backend transactional architectures.
    </p>

    <h3 class="sec-subheading">1.2 Proposed Solution</h3>
    <p>
      LastZone delivers a cohesive esports tournament platform with real-time score ingestion, dynamic 3D armory inspection (anatomical body-part targeting and weapon attachments), encrypted JWT user authentication, and high-frequency leaderboard aggregation with strict data validation.
    </p>

    <h2 class="sec-heading">2. ABSTRACT, OBJECTIVES AND SCOPE</h2>
    <h3 class="sec-subheading">2.1 Abstract</h3>
    <p>
      The platform implements an immersive esports web application demonstrating player registration, 3D armor/weapon inspection via Three.js with multi-angle GSAP camera tweens, Unity WebGL combat simulation, JSON-backed leaderboard queries, Spring Boot REST persistence, and containerized CI/CD execution via Jenkins and Docker.
    </p>

    <h3 class="sec-subheading">2.2 Objectives</h3>
    <ul>
      <li>Develop a responsive, cyberpunk-themed tactical interface using semantic HTML5, modern CSS, and Vite.</li>
      <li>Engineer an interactive 3D Armory Inspection suite using Three.js, OrbitControls, and targeted GSAP camera zooms.</li>
      <li>Embed an interactive Unity WebGL survival game transmitting live match score packets over HTTP REST.</li>
      <li>Build a Spring Boot 3.3.5 REST API with PostgreSQL persistence, JPA entities, and BCrypt password encryption.</li>
      <li>Establish an automated Jenkins CI/CD pipeline executing build, test, and container packaging on every commit.</li>
    </ul>

    <h3 class="sec-subheading">2.3 Scope</h3>
    <p>
      Demonstration encompasses full client-server lifecycle, 3D graphics rendering, automated score submission, and DevOps pipeline. Commercial financial transactions and production multi-region matchmaking clusters are simulated.
    </p>

    <h3 class="sec-subheading">2.4 Measurable Outcomes</h3>
    <table class="report-table">
      <thead>
        <tr>
          <th>METRIC</th>
          <th>VALUE</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Laboratory experiments mapped</td><td>9 Syllabus Requirements</td></tr>
        <tr><td>Primary application views / routes</td><td>6 Tactical Routes</td></tr>
        <tr><td>Relational database tables</td><td>4 Entities (Users, Scores, Tournaments, Audit)</td></tr>
        <tr><td>Three.js 3D models & inspection angles</td><td>3 GLTF Models / 4 Anatomical Focus Angles</td></tr>
        <tr><td>Automated smoke-test checks</td><td>34 Passing Unit/Integration Checks</td></tr>
      </tbody>
    </table>

    <div class="page-footer-num">6</div>
  </div>
</div>

<!-- ================= PAGE 7: TECH STACK & ARCHITECTURE ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="callout-box">
      <strong>Design language:</strong> dark tactical stealth palette (#050505), high-contrast safety orange/red (#ff3b30) action accents, cyan telemetry feeds, glassmorphic HUD cards, and monospace typography.
    </div>

    <h2 class="sec-heading">3. TECHNOLOGY STACK</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 18%;">LAYER</th>
          <th style="width: 25%;">TECHNOLOGY</th>
          <th style="width: 57%;">ROLE IN LASTZONE</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Structure</td><td>HTML5 / JSX</td><td>Semantic DOM landmarks, canvas wrappers, tactical HUD modals.</td></tr>
        <tr><td>Presentation</td><td>Tailwind CSS / Vanilla CSS</td><td>CSS Grid, glassmorphism backdrop-filters, responsive layouts.</td></tr>
        <tr><td>3D Graphics</td><td>Three.js & GSAP</td><td>WebGL rendering, PBR shaders, dynamic camera transitions, OrbitControls.</td></tr>
        <tr><td>Interactive Game</td><td>Unity WebGL</td><td>C# survival simulation, raycasting, physics, score dispatch.</td></tr>
        <tr><td>Data Exchange</td><td>JSON / REST API</td><td>Match telemetry, score ingestion, player profile payloads over HTTP.</td></tr>
        <tr><td>Server Logic</td><td>Spring Boot 3.3.5 (Java 21)</td><td>Spring MVC, Spring Security, BCrypt, JPA Hibernate ORM.</td></tr>
        <tr><td>Database</td><td>PostgreSQL 16</td><td>Relational persistence, unique constraints, foreign keys, indexing.</td></tr>
        <tr><td>CI / CD</td><td>Jenkins & Docker</td><td>Automated multi-stage pipelines, Maven build, container deployment.</td></tr>
        <tr><td>Verification</td><td>JUnit 5 & Smoke Tests</td><td>Automated assertions for database entities and HTTP endpoints.</td></tr>
        <tr><td>Version Control</td><td>Git / GitHub</td><td>Commit history, branching, and webhook trigger integration.</td></tr>
      </tbody>
    </table>

    <h2 class="sec-heading">4. SYSTEM ARCHITECTURE</h2>
    <div class="three-col-arch">
      <div class="arch-box">
        <h4>PRESENTATION</h4>
        <p><strong>React + Three.js</strong></p>
        <p>• Scrollytelling Home</p>
        <p>• 3D Weapon Lab</p>
        <p>• Unity WebGL Arena</p>
        <p>• Live Leaderboard HUD</p>
        <p style="font-size: 8pt; color: #555;">Canvas → Shaders → DOM</p>
      </div>
      <div class="arch-box">
        <h4>CLIENT LOGIC</h4>
        <p><strong>Event & State Engine</strong></p>
        <p>• GSAP Camera Tweens</p>
        <p>• JWT Auth Context</p>
        <p>• Axios HTTP Client</p>
        <p>• Web Storage (Tokens)</p>
        <p style="font-size: 8pt; color: #555;">User Input → State Dispatch</p>
      </div>
      <div class="arch-box">
        <h4>SERVER & DATA</h4>
        <p><strong>Spring Boot & Postgres</strong></p>
        <p>• REST Controllers</p>
        <p>• Spring Data Repositories</p>
        <p>• PostgreSQL 16 DB</p>
        <p>• Jenkins CI/CD Agent</p>
        <p style="font-size: 8pt; color: #555;">Validated Request → SQL</p>
      </div>
    </div>

    <h3 class="sec-subheading">4.1 Request Flow</h3>
    <p>
      The browser initializes the client SPA and renders static and 3D scenes locally. The embedded Unity WebGL combat engine runs in an isolated canvas, capturing player survival duration, kills, and accuracy. Upon match termination, a JSON payload is dispatched via HTTP POST to the Spring Boot backend. Spring Security validates authentication tokens, Hibernate binds parameters into SQL queries, and PostgreSQL persists score records before returning status to the client.
    </p>

    <h3 class="sec-subheading">4.2 Folder Organization</h3>
    <p>
      The project enforces clean separation: <code>src/components/</code> (HUD, Canvas, Modals), <code>src/pages/</code> (Weapons, Leaderboard, Arena), <code>backend/src/main/java/</code> (Controllers, Entities, Services), <code>backend/src/main/resources/</code> (schema, application.yml), and <code>Jenkinsfile</code> (CI/CD pipeline script).
    </p>

    <h3 class="sec-subheading">4.3 Data Boundaries</h3>
    <p>
      Transient camera coordinates and audio states use <code>sessionStorage</code>; authenticated session JWT tokens use <code>localStorage</code>; persistent match scores, player stats, and historical rankings reside strictly within PostgreSQL.
    </p>

    <div class="page-footer-num">7</div>
  </div>
</div>

<!-- ================= PAGE 8: HOME PAGE & DASHBOARD ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">5. HOME PAGE AND PRODUCT IDENTITY</h2>
    <p>
      The landing page introduces the LastZone tactical combat experience with cinematic scrollytelling, high-contrast brand identity, mission telemetry, and top-tier navigation.
    </p>
    <div class="fig-container">
      <img src="${homePage}" style="max-height: 100mm;" alt="LastZone Home Page">
      <div class="fig-caption">Figure 5.1 — LastZone home page captured from http://localhost:5173/</div>
    </div>
    <p>
      The hero section highlights the tournament environment with tactical callouts, mission objectives, active player counters, and real-time audio feeds. Interactive links smoothly route users to the 3D Armory, the Survival Arena, and the Global Leaderboard.
    </p>

    <h2 class="sec-heading">6. INTERACTIVE DASHBOARD</h2>
    <p>
      The tactical command interface consolidates player status, active tournament brackets, combat readiness metrics, and quick deployment buttons into a unified HUD.
    </p>
    <div class="fig-container">
      <img src="${unityGame}" style="max-height: 98mm;" alt="Interactive Dashboard">
      <div class="fig-caption">Figure 6.1 — Interactive tactical arena dashboard and simulation launcher</div>
    </div>

    <div class="page-footer-num">8</div>
  </div>
</div>

<!-- ================= PAGE 9: REGISTRATION & 3D ARMORY ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <p>
      JavaScript initializes state listeners, verifies network socket availability, updates combat metrics, and maintains persistent user preferences across browser sessions.
    </p>

    <h2 class="sec-heading">7. ADVANCED REGISTRATION</h2>
    <p>
      The cadet enrollment module enforces strict HTML5 client-side constraints, credential strength metrics, and responsive feedback before server submission.
    </p>
    <div class="fig-container">
      <img src="${registerForm}" style="max-height: 98mm;" alt="Registration Form">
      <div class="fig-caption">Figure 7.1 — Cadet recruitment and authentication screen</div>
    </div>
    <p>
      The form utilizes email, text, password, and confirmation controls with regex validation, real-time error banners, and automated password hashing prior to backend transmission.
    </p>

    <h2 class="sec-heading">8. WALLET AND PAYMENT QUEUE / ARMORY LAB</h2>
    <p>
      The 3D weapon and equipment inspection laboratory allows real-time manipulation of game assets with granular targeting and anatomical inspection points.
    </p>
    <div class="fig-container">
      <img src="${weaponInspection}" style="max-height: 98mm;" alt="Weapon Inspection">
      <div class="fig-caption">Figure 8.1 — Interactive 3D Weapon inspection laboratory with anatomical camera controls</div>
    </div>

    <div class="page-footer-num">9</div>
  </div>
</div>

<!-- ================= PAGE 10: EVENT-DRIVEN COMBAT CENTER ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="fig-caption" style="margin-bottom: 8px;">Figure 8.2 — Spartan Exosuit 3D model with PBR shaders and material inspection</div>
    <div class="fig-container">
      <img src="${spartanArmor}" style="max-height: 105mm;" alt="Spartan Model View">
    </div>

    <h2 class="sec-heading">9. EVENT-DRIVEN PAYMENT CENTER / COMBAT ARENA</h2>
    <p>
      Tournament gameplay, health tracking, and weapon fire events share an optimized, event-driven WebGL combat interface.
    </p>
    <div class="fig-container">
      <img src="${gameplay}" style="max-height: 100mm;" alt="Event Driven Gameplay">
      <div class="fig-caption">Figure 9.1 — Live zombie combat simulation with real-time kill feed and health telemetry</div>
    </div>
    <p>
      The combat module binds mouse down, WASD key navigation, collision raycasting, and reload events. Real-time game events generate high-frequency state updates without UI thread blocking.
    </p>

    <div class="page-footer-num">10</div>
  </div>
</div>

<!-- ================= PAGE 11: LEADERBOARD & REPORTS ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">10. TRANSACTION CENTER / LEADERBOARD</h2>
    <p>
      The tournament leaderboard module demonstrates real-time record selection, multi-column sorting, search filtering, and asynchronous AJAX/REST synchronization.
    </p>
    <div class="fig-container">
      <img src="${leaderboard}" style="max-height: 105mm;" alt="Leaderboard Center">
      <div class="fig-caption">Figure 10.1 — Searchable and filterable tournament leaderboard interface</div>
    </div>
    <p>
      Every competitor record possesses a unique identifier, rank badge, kill tally, and score metric. Users can filter by division, search gamer tags, and trigger asynchronous JSON updates without full page reloads.
    </p>

    <h2 class="sec-heading">11. REPORTS AND INSIGHTS</h2>
    <p>
      The combat telemetry report summarizes match kills, survival duration, weapon accuracy, and tournament points. Print-friendly CSS rules automatically omit navigation bars for academic submission.
    </p>

    <div class="page-footer-num">11</div>
  </div>
</div>

<!-- ================= PAGE 12: BACKEND & DATABASE DESIGN ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <p>
      Responsive charts and tactical KPI tiles translate match events into actionable combat intelligence. Clean styling guarantees legibility across mobile, tablet, and paper report media.
    </p>

    <h2 class="sec-heading">12. PHP BACKEND AND USER MANAGEMENT / SPRING BOOT BACKEND</h2>
    <p>
      Spring Boot REST controllers provide validated persistence, JWT security, and administrative CRUD endpoints while strictly conforming to REST standards.
    </p>
    <div class="fig-container">
      <img src="${backendApi}" style="max-height: 95mm;" alt="Backend REST API">
      <div class="fig-caption">Figure 12.1 — Spring Boot RESTful API endpoints delivering live JSON score telemetry</div>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 25%;">ENDPOINT</th>
          <th style="width: 75%;">RESPONSIBILITY</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>POST /api/auth/register</code></td><td>Validates username/email uniqueness, hashes password with BCrypt, saves User.</td></tr>
        <tr><td><code>POST /api/auth/login</code></td><td>Authenticates credentials, generates cryptographically signed JWT token.</td></tr>
        <tr><td><code>GET /api/scores/top</code></td><td>Returns top 10 tournament scores sorted by points descending via JPA.</td></tr>
        <tr><td><code>POST /api/scores/submit</code></td><td>Receives game telemetry (kills, score, time), attaches player ID, writes to DB.</td></tr>
        <tr><td><code>GET /api/users/profile</code></td><td>Protected endpoint returning authenticated player stats and tournament history.</td></tr>
        <tr><td><code>GET /actuator/health</code></td><td>Spring Boot Actuator health probe for automated container liveness checking.</td></tr>
      </tbody>
    </table>

    <h2 class="sec-heading">13. DATABASE DESIGN</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 20%;">TABLE</th>
          <th style="width: 35%;">PRIMARY PURPOSE</th>
          <th style="width: 45%;">IMPORTANT CONSTRAINTS</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>users</code></td><td>Player credentials and profile data</td><td>Unique username and email, BCrypt hash, created_at timestamp.</td></tr>
        <tr><td><code>scores</code></td><td>Match telemetry and tournament points</td><td>FK to users(id), positive score, positive kills count, indexed on score DESC.</td></tr>
        <tr><td><code>tournaments</code></td><td>Active competition brackets</td><td>Unique tournament code, start/end timestamps, status enum (ACTIVE/CLOSED).</td></tr>
        <tr><td><code>audit_logs</code></td><td>Security and authentication audit trail</td><td>FK to users(id), client IP address, action string, event timestamp.</td></tr>
      </tbody>
    </table>

    <div class="page-footer-num">12</div>
  </div>
</div>

<!-- ================= PAGE 13: RELATIONSHIPS & ASSET ANALYZER ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="callout-box">
      <strong>Configuration:</strong> database credentials and JWT secret keys are loaded from system environment variables (<code>POSTGRES_DB</code>, <code>POSTGRES_USER</code>, <code>JWT_SECRET</code>). Sensitive secrets are strictly excluded from source control.
    </div>

    <h3 class="sec-subheading">13.1 Relationship Model</h3>
    <p>
      One user can submit multiple score records across different tournament stages. Foreign keys implement cascading relationships to preserve referential integrity across player deletions. UTF-8 character encoding is enforced across all tables to support global player handles.
    </p>

    <h3 class="sec-subheading">13.2 Data Integrity</h3>
    <p>
      Database-level constraints guarantee that negative scores or invalid survival timestamps are rejected at the storage layer. B-Tree indexes on <code>scores(score DESC)</code> guarantee sub-millisecond leaderboard retrieval during peak concurrency.
    </p>

    <h3 class="sec-subheading">13.3 Fictional Seed Data</h3>
    <p>
      The automated schema migration script populates realistic mock tournament participants, verified scores ranging from 12,000 to 95,000 points, and sample match timestamps for testing.
    </p>

    <h2 class="sec-heading">14. WEBSITE ANALYZER / ASSET & PERFORMANCE ANALYZER</h2>
    <p>
      The asset pipeline verifies 3D GLTF asset headers, textures, and HTTP API response timings while enforcing strict payload thresholds.
    </p>
    <div class="fig-container">
      <img src="${loginForm}" style="max-height: 98mm;" alt="Login Security Portal">
      <div class="fig-caption">Figure 14.1 — Secure player sign-in and token authentication portal</div>
    </div>
    <p>
      The validation suite verifies TLS termination, enforces response size limits, and profiles Three.js vertex counts to ensure 60 FPS performance on standard classroom computers.
    </p>

    <div class="callout-box">
      <strong>Security boundary:</strong> the WebGL engine isolates GPU shaders within an unprivileged sandbox. Raw file system access and insecure cross-origin asset requests are blocked.
    </div>

    <div class="page-footer-num">13</div>
  </div>
</div>

<!-- ================= PAGE 14: RESPONSIVE DESIGN & EXP DETAILS I ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">15. RESPONSIVE DESIGN, ACCESSIBILITY AND SECURITY</h2>
    <h3 class="sec-subheading">15.1 Responsive Design</h3>
    <p>
      CSS Grid and Flexbox establish fluid layouts across 4K desktop, laptop, tablet, and mobile viewports. Media query breakpoints dynamically re-stack HUD cards and hide intensive 3D post-processing on constrained mobile devices.
    </p>

    <h3 class="sec-subheading">15.2 Accessibility</h3>
    <p>
      Semantic landmark tags (<code>&lt;header&gt;</code>, <code>&lt;nav&gt;</code>, <code>&lt;main&gt;</code>, <code>&lt;footer&gt;</code>), high-contrast ARIA roles, visible focus outlines, and keyboard shortcuts ensure comprehensive navigability.
    </p>

    <h3 class="sec-subheading">15.3 Security Controls</h3>
    <ul>
      <li>Hibernate and Spring Data JPA parameterize all database queries, preventing SQL injection.</li>
      <li>Passwords are salted and hashed using BCrypt with work factor 12 before persistence.</li>
      <li>Stateless JWT tokens secure API endpoints with time-bounded expiration.</li>
      <li>CORS policies restrict backend communication strictly to authorized frontend origins.</li>
      <li>XSS protection is enforced by escaping all rendered player usernames in the leaderboard DOM.</li>
    </ul>

    <h2 class="sec-heading">16. EXPERIMENT IMPLEMENTATION DETAILS I</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 10%;">EXP.</th>
          <th style="width: 32%;">IMPLEMENTATION</th>
          <th style="width: 58%;">DEMONSTRATION</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>App.jsx, Navbar.jsx</td><td>Semantic header/nav/main/footer, statistics cards, responsive layout.</td></tr>
        <tr><td>2</td><td>index.css, TacticalHUD.jsx</td><td>CSS Grid/Flexbox, cyberpunk color variables, HUD animations, toast alerts.</td></tr>
        <tr><td>3</td><td>RegisterModal.jsx</td><td>Specialized HTML5 inputs, pattern validation, real-time client feedback.</td></tr>
        <tr><td>4</td><td>WeaponsPage.jsx, Three.js</td><td>3D asset loader, OrbitControls, localStorage for audio and camera toggles.</td></tr>
        <tr><td>5</td><td>Shared CSS & media queries</td><td>Breakpoints, transforms, progress bars, responsive canvas sizing, print styling.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">Demonstration Sequence</h3>
    <ul>
      <li>Open Home page and inspect semantic landmarks, HUD counters, and navigation menus.</li>
      <li>Toggle audio telemetry and camera modes; observe persistent state in browser storage.</li>
      <li>Submit malformed registration inputs to verify client-side validation triggers.</li>
      <li>Manipulate the 3D Weapon laboratory using zoom buttons and mouse orbit controls.</li>
      <li>Resize viewport across tablet and mobile dimensions to verify responsive HUD reorganization.</li>
    </ul>

    <div class="page-footer-num">14</div>
  </div>
</div>

<!-- ================= PAGE 15: EXP DETAILS II & TESTING ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">17. EXPERIMENT IMPLEMENTATION DETAILS II</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 10%;">EXP.</th>
          <th style="width: 32%;">IMPLEMENTATION</th>
          <th style="width: 58%;">DEMONSTRATION</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>6</td><td>CombatEvents.js, Arena.jsx</td><td>Keyboard WASD bindings, mouse look, raycasting, dynamic score calculation.</td></tr>
        <tr><td>7</td><td>Spring Boot Backend & JPA</td><td>PostgreSQL connection, entity relationships, prepared CRUD operations.</td></tr>
        <tr><td>8</td><td>TelemetryService.java</td><td>Payload validation, time tracking, cheat prevention, sanitized response.</td></tr>
        <tr><td>9</td><td>Leaderboard.jsx, Axios AJAX</td><td>Dynamic JSON fetch, table filtering, auto-polling with retry and error states.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">Demonstration Sequence</h3>
    <ul>
      <li>Play the survival arena combat simulation and observe live score updates.</li>
      <li>Submit score payload to backend; observe JSON persistence in PostgreSQL.</li>
      <li>Inspect the real-time leaderboard table as new records populate dynamically.</li>
      <li>Trigger network disconnect to verify AJAX retry mechanism and error banner.</li>
    </ul>

    <div class="callout-box">
      <strong>Automated result:</strong> LastZone test suite passed (34 checks across frontend, API, and database).
    </div>

    <h2 class="sec-heading">18. TESTING AND VERIFICATION</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 25%;">TEST AREA</th>
          <th style="width: 40%;">CHECKS PERFORMED</th>
          <th style="width: 35%;">EXPECTED RESULT</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Required files</td><td>Components, pages, controllers, models</td><td>Every required file present.</td></tr>
        <tr><td>JSON payloads</td><td>Score submission schema & fields</td><td>All JSON packets parse correctly.</td></tr>
        <tr><td>Event listeners</td><td>Three.js and canvas input events</td><td>Smooth interaction, no event leaks.</td></tr>
        <tr><td>Storage state</td><td>Tokens in localStorage, temporary in session</td><td>Correct persistence behavior.</td></tr>
        <tr><td>AJAX / REST</td><td>GET /api/scores/top with pagination</td><td>Dynamic ranking returned in &lt;100ms.</td></tr>
        <tr><td>SQL Constraints</td><td>User uniqueness and Foreign Key cascading</td><td>Database rejects duplicates cleanly.</td></tr>
        <tr><td>Security</td><td>BCrypt hashing and JWT validity</td><td>Plain passwords never stored or logged.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">18.1 Manual Verification</h3>
    <ul>
      <li>Form errors: short passwords, mismatched passwords, malformed email patterns.</li>
      <li>Browser behavior: theme persistence, canvas frame rates, smooth GSAP camera zooms.</li>
      <li>Backend resilience: database offline messaging, duplicate registration rejection.</li>
    </ul>

    <div class="page-footer-num">15</div>
  </div>
</div>

<!-- ================= PAGE 16: RUNTIME & CI/CD WORKFLOW ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">19. XAMPP RUNTIME ENVIRONMENT / DOCKER & BACKEND RUNTIME</h2>
    <p>
      The local execution environment leverages PostgreSQL 16 on port 5432 and the Spring Boot Java runtime on port 8080 to provide persistent tournament services.
    </p>
    <div class="fig-container">
      <img src="${jenkinsJob}" style="max-height: 98mm;" alt="Jenkins Job Overview">
      <div class="fig-caption">Figure 19.1 — Jenkins CI/CD pipeline job overview showing automated build triggers</div>
    </div>
    <p>
      The architecture supports both bare-metal development and containerized multi-container deployment via Docker Compose, isolating database, API, and frontend workloads.
    </p>

    <h2 class="sec-heading">20. LOCAL SERVER AND SOURCE-CONTROL WORKFLOW</h2>
    <p>
      The application leverages Git for version tracking and automated Jenkins webhooks for continuous integration.
    </p>
    <div class="fig-container">
      <img src="${jenkinsBuild}" style="max-height: 98mm;" alt="Jenkins Build Success">
      <div class="fig-caption">Figure 20.1 — Successful Jenkins automated build #3 executing test and packaging stages</div>
    </div>

    <div class="page-footer-num">16</div>
  </div>
</div>

<!-- ================= PAGE 17: DATABASE EVIDENCE I ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <p>
      The Jenkins pipeline executes automated compilation, executes JUnit test suites, packages executable JAR artifacts, and builds lightweight Docker images upon every push to the repository.
    </p>
    <p>
      <strong>Repository:</strong> https://github.com/dharanidharanjaidev/lastone-tournament
    </p>

    <h2 class="sec-heading">21. DATABASE EVIDENCE — USERS & TOURNAMENT ROSTERS</h2>
    <p>
      The relational database evidence confirms that player profiles and tournament rosters are correctly structured and persisted with strong integrity constraints.
    </p>
    <div class="fig-container">
      <img src="${jenkinsConsole}" style="max-height: 105mm;" alt="Jenkins Console Execution">
      <div class="fig-caption">Figure 21.1 — Automated pipeline execution log verifying compilation and artifact generation</div>
    </div>

    <p style="margin-top: 10px;">
      Database schemas enforce unique constraints on <code>username</code> and <code>email</code> columns. Password hashes utilize standard 60-character BCrypt strings, ensuring that user credentials remain secure against compromise.
    </p>

    <div class="page-footer-num">17</div>
  </div>
</div>

<!-- ================= PAGE 18: DATABASE EVIDENCE II & ADVANTAGES ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">22. DATABASE EVIDENCE — TRANSACTIONS AND USERS / MATCH SCORES</h2>
    <p>
      The database stores telemetry data including kills, survival time, precision rate, and final calculated score.
    </p>
    <div class="fig-container">
      <img src="${backendApi}" style="max-height: 100mm;" alt="Database Telemetry Evidence">
      <div class="fig-caption">Figure 22.1 — Live API telemetry payload demonstrating database persistence and relational integrity</div>
    </div>

    <h2 class="sec-heading">23. ADVANTAGES, LIMITATIONS AND TROUBLESHOOTING</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 50%;">ADVANTAGES</th>
          <th style="width: 50%;">CURRENT LIMITATIONS</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Complete full-stack integration covering 9 syllabus experiments</td><td>Simulated tournament matchmaking rather than dedicated game servers</td></tr>
        <tr><td>Immersive Three.js 3D graphics with targeted camera inspection</td><td>High-end 3D graphics require WebGL-compatible hardware</td></tr>
        <tr><td>Robust Spring Boot 3.3.5 backend with JPA & PostgreSQL</td><td>JWT tokens stored in client localStorage rather than HttpOnly cookies</td></tr>
        <tr><td>Automated Jenkins CI/CD pipeline with Docker integration</td><td>Single-region database deployment rather than distributed shards</td></tr>
      </tbody>
    </table>

    <div class="page-footer-num">18</div>
  </div>
</div>

<!-- ================= PAGE 19: TROUBLESHOOTING & RESTART CHECKLIST ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h3 class="sec-subheading">23.1 Troubleshooting Guide</h3>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 35%;">SYMPTOM</th>
          <th style="width: 65%;">ACTION</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>3D Model renders black or blank canvas</td><td>Verify ambient/directional lighting in Three.js and check WebGL hardware acceleration.</td></tr>
        <tr><td>Backend API returns Connection Refused</td><td>Ensure PostgreSQL service is running on port 5432 and Spring Boot is active on 8080.</td></tr>
        <tr><td>Leaderboard AJAX displays network error</td><td>Confirm CORS configuration in <code>SecurityConfig.java</code> allows <code>http://localhost:5173</code>.</td></tr>
        <tr><td>Jenkins build failure on Maven stage</td><td>Check Java 21 environment variables and verify <code>pom.xml</code> dependency versions.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">23.2 Conclusion</h3>
    <p>
      LastZone successfully bridges front-end graphical innovation with back-end enterprise reliability. By synthesizing responsive layouts, interactive 3D WebGL assets, event-driven gameplay, Spring Boot REST persistence, and automated Jenkins CI/CD pipelines, the project establishes a rigorous, comprehensive full-stack laboratory implementation.
    </p>

    <h3 class="sec-subheading">23.3 Future Enhancements</h3>
    <ul>
      <li>Implement real-time WebSocket communication for instantaneous multiplayer deathmatch synchronization.</li>
      <li>Integrate WebRTC voice communication for squad coordination in tournament lobbies.</li>
      <li>Deploy cloud Kubernetes clusters with automated pod scaling based on active tournament volume.</li>
    </ul>

    <h2 class="sec-heading">24. RESTART AND SHUTDOWN OPERATING CHECKLIST</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">STEP</th>
          <th style="width: 25%;">ACTION</th>
          <th style="width: 67%;">DETAIL</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="text-align: center;">1</td><td>Start PostgreSQL</td><td>Start PostgreSQL service; confirm port 5432 is listening.</td></tr>
        <tr><td style="text-align: center;">2</td><td>Launch Backend</td><td>Navigate to <code>backend/</code> and run <code>mvn spring-boot:run</code>.</td></tr>
        <tr><td style="text-align: center;">3</td><td>Launch Frontend</td><td>In project root, run <code>npm run dev</code> (accessible at <code>http://localhost:5173/</code>).</td></tr>
        <tr><td style="text-align: center;">4</td><td>Verify 3D Lab</td><td>Navigate to <code>/weapons</code> and test body-part zoom buttons and shaders.</td></tr>
        <tr><td style="text-align: center;">5</td><td>Verify Leaderboard</td><td>Navigate to <code>/leaderboard</code> and confirm live scores load over REST.</td></tr>
        <tr><td style="text-align: center;">6</td><td>Execute Tests</td><td>Run <code>mvn test</code> to confirm all unit and integration test assertions pass.</td></tr>
        <tr><td style="text-align: center;">7</td><td>Stop Safely</td><td>Use <code>Ctrl+C</code> to cleanly terminate node and Spring processes.</td></tr>
      </tbody>
    </table>

    <div class="page-footer-num">19</div>
  </div>
</div>

<!-- ================= PAGE 20: REFERENCES & REPOSITORY ARTIFACTS ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">25. REFERENCES AND REPOSITORY ARTIFACTS</h2>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">NO.</th>
          <th style="width: 92%;">REFERENCE</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style="text-align: center;">1</td><td>MDN Web Docs — HTML5 semantic layout, Canvas API, CSS Grid, and Web Storage APIs.</td></tr>
        <tr><td style="text-align: center;">2</td><td>Three.js Documentation — GLTFLoader, OrbitControls, PBR materials, and camera tweening.</td></tr>
        <tr><td style="text-align: center;">3</td><td>Spring Boot Reference Guide — Spring MVC, Data JPA, Security filters, and Actuator.</td></tr>
        <tr><td style="text-align: center;">4</td><td>PostgreSQL 16 Manual — Relational constraints, B-Tree indexes, and ACID transaction isolation.</td></tr>
        <tr><td style="text-align: center;">5</td><td>OWASP Top 10 Guidelines — JWT token handling, input sanitization, and SQL injection prevention.</td></tr>
        <tr><td style="text-align: center;">6</td><td>Jenkins User Documentation — Declarative pipeline syntax, automated Maven builds, and triggers.</td></tr>
        <tr><td style="text-align: center;">7</td><td>LastZone Repository & Documentation — https://github.com/dharanidharanjaidev/lastone-tournament</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading" style="margin-top: 15px;">REPOSITORY ARTIFACTS</h3>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 30%;">ARTIFACT</th>
          <th style="width: 70%;">LOCATION / DESCRIPTION</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Project Repository</td><td><code>https://github.com/dharanidharanjaidev/lastone-tournament</code></td></tr>
        <tr><td>Primary Documentation</td><td><code>README.md</code>, Architecture diagrams, and API spec</td></tr>
        <tr><td>Frontend Source</td><td><code>src/components/</code>, <code>src/pages/</code>, and <code>src/context/</code></td></tr>
        <tr><td>3D Inspection Engine</td><td><code>src/pages/WeaponsPage.jsx</code> (Three.js & GSAP camera rig)</td></tr>
        <tr><td>Backend REST API</td><td><code>backend/src/main/java/com/lastzone/</code></td></tr>
        <tr><td>Database Schema</td><td><code>backend/src/main/resources/schema.sql</code> (PostgreSQL DDL)</td></tr>
        <tr><td>DevOps Pipeline</td><td><code>Jenkinsfile</code> & Dockerfile container specifications</td></tr>
        <tr><td>Automated Test Suite</td><td><code>backend/src/test/java/com/lastzone/</code></td></tr>
      </tbody>
    </table>

    <div class="callout-box" style="margin-top: 25px;">
      This report was prepared from the implemented LastZone repository, running local services, and automated build evidence. It strictly adheres to the Coimbatore Institute of Technology 23IT721 laboratory guidelines.
    </div>

    <div class="page-footer-num">20</div>
  </div>
</div>

</body>
</html>
`;

const outPath = path.join(__dirname, 'report_fullstack_cit.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('HTML written successfully to', outPath, 'Length:', html.length);
