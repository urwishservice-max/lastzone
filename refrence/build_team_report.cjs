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

console.log('Encoding base64 assets for team project report...');
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
const analyzer = getB64('analyzer.png');
const pmaUsers = getB64('pma_users.png');
const pmaScores = getB64('pma_scores.png');
const pmaRanks = getB64('pma_ranks.png');

console.log('Building exactly matched 20-page report HTML...');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>COIMBATORE INSTITUTE OF TECHNOLOGY - 23IT721 FULL STACK DEVELOPMENT LABORATORY PROJECT REPORT</title>
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
  
  /* Typography */
  h1.college-title {
    font-size: 16pt;
    margin: 0 0 4px 0;
    font-weight: bold;
    letter-spacing: 0.5px;
    text-align: center;
  }
  h2.college-sub {
    font-size: 11pt;
    font-style: italic;
    font-weight: normal;
    margin: 0 0 25px 0;
    text-align: center;
  }
  h2.course-heading {
    font-size: 12.5pt;
    font-weight: bold;
    margin: 20px 0 6px 0;
    letter-spacing: 0.5px;
    text-align: center;
  }
  h3.project-heading {
    font-size: 13pt;
    font-weight: bold;
    margin: 0 0 25px 0;
    text-transform: uppercase;
    text-align: center;
  }
  h1.proj-title {
    font-size: 17pt;
    font-weight: bold;
    margin: 0 0 6px 0;
    letter-spacing: 0.8px;
    text-align: center;
  }
  h2.proj-subtitle {
    font-size: 12pt;
    font-weight: bold;
    font-style: italic;
    margin: 0 0 20px 0;
    text-align: center;
  }

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
    max-height: 120mm;
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

  /* Cover Page */
  .cover-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    padding: 12mm 5mm 8mm 5mm;
  }
  .cover-logo {
    width: 105px;
    height: auto;
    margin: 15px 0;
  }
  .cover-submit {
    width: 100%;
    margin-top: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .submit-table {
    border-collapse: collapse;
    margin-top: 8px;
  }
  .submit-table td {
    padding: 3px 18px;
    font-size: 11pt;
    font-weight: bold;
    text-align: left;
  }

  /* Evaluation Form */
  .eval-header-table {
    width: 100%;
    margin: 6px 0 10px 0;
    font-size: 10pt;
  }
  .eval-header-table td {
    padding: 3px 4px;
  }
  .eval-obs-box {
    border: 1px solid #333;
    height: 90px;
    margin: 8px 0 15px 0;
    padding: 6px;
    font-size: 10pt;
  }
  .eval-signature-row {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    font-size: 10.5pt;
  }

  /* Architecture grid */
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

  .terminal-box {
    background: #0c0c0c;
    color: #e5e5e5;
    padding: 10px 14px;
    font-family: Consolas, monospace;
    font-size: 9pt;
    border-radius: 4px;
    border: 1px solid #333;
    margin: 8px 0;
    line-height: 1.4;
  }

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
        <h1 class="college-title">COIMBATORE INSTITUTE OF TECHNOLOGY</h1>
        <h2 class="college-sub">(Government Aided Autonomous Institution Affiliated to Anna University)</h2>
        
        <h2 class="course-heading">23IT721 - FULL STACK DEVELOPMENT LABORATORY</h2>
        <h3 class="project-heading">PROJECT</h3>
        
        <h1 class="proj-title">ONLINE TOURNAMENT MANAGEMENT SYSTEM</h1>
        <h2 class="proj-subtitle">(LastZone)</h2>
      </div>

      <div>
        <img src="${citLogo}" class="cover-logo" alt="CIT Emblem Logo">
      </div>

      <div>
        <h2 style="font-size: 13.5pt; font-weight: bold; letter-spacing: 1px; margin: 10px 0 20px 0;">OCTOBER 2026</h2>
      </div>

      <div class="cover-submit">
        <p style="font-style: italic; font-size: 11pt; margin-bottom: 6px;">Submitted by</p>
        <table class="submit-table">
          <tr>
            <td>2303717620521014</td>
            <td>DHARANIDHARAN V</td>
          </tr>
          <tr>
            <td>2303717620521019</td>
            <td>GOKUL SV</td>
          </tr>
          <tr>
            <td>2303717620521029</td>
            <td>MADHAVAN M</td>
          </tr>
          <tr>
            <td>2303717620521036</td>
            <td>NIKHIL KUMAR B</td>
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
    <div style="padding: 12mm 5mm 0 5mm;">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 class="college-title" style="font-size: 15pt;">COIMBATORE INSTITUTE OF TECHNOLOGY</h1>
        <h2 class="college-sub">(Government Aided Autonomous Institution Affiliated to Anna University)</h2>
        <h2 style="font-size: 13.5pt; font-weight: bold; letter-spacing: 1px; text-decoration: underline; margin: 25px 0 25px 0;">BONAFIDE CERTIFICATE</h2>
      </div>

      <p style="font-size: 11pt; line-height: 1.8; text-align: justify; margin-bottom: 20px;">
        Certified that this project report titled <strong>"ONLINE TOURNAMENT MANAGEMENT SYSTEM (LastZone)"</strong> is the bonafide work of 
        <strong>2303717620521014 - DHARANIDHARAN V, 2303717620521019 - GOKUL SV, 2303717620521029 - MADHAVAN M</strong> and 
        <strong>2303717620521036 - NIKHIL KUMAR B</strong> completed during the academic year <strong>2026-2027-Semester VII</strong> for the project presentation of 
        <strong>23IT721 - FULL STACK DEVELOPMENT LABORATORY</strong> under our supervision.
      </p>

      <p style="font-size: 11pt; font-style: italic; line-height: 1.7; margin-bottom: 40px;">
        Certified that the candidates were examined by using the project work examination.
      </p>

      <div style="margin-top: 40px;">
        <p style="font-size: 11pt; font-weight: bold; margin-bottom: 18px;">Review Members:</p>
        <div style="margin-left: 20px; font-size: 11pt; line-height: 2.2;">
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
    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 4px;">
      <img src="${citLogo}" style="width: 48px; height: 48px;" alt="Logo">
      <div style="text-align: center;">
        <h3 style="font-size: 12pt; margin: 0; font-weight: bold;">Coimbatore Institute of Technology-Coimbatore-14</h3>
        <h4 style="font-size: 11pt; margin: 2px 0 0 0; font-weight: bold;">Department of Information Technology</h4>
      </div>
    </div>

    <div style="text-align: center; margin: 6px 0 8px 0;">
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
        <td colspan="3" style="border-top: 1px solid #333; padding-top: 5px;">
          <strong>Roll No :</strong> 2303717620521014, 2303717620521019, 2303717620521029, 2303717620521036
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <strong>Name :</strong> DHARANIDHARAN V, GOKUL SV, MADHAVAN M, NIKHIL KUMAR B
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <strong>Title :</strong> ONLINE TOURNAMENT MANAGEMENT SYSTEM (LastZone)
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
          <td>Simulation/Results( AJAX/JQuery Operations)</td>
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

    <div style="font-weight: bold; font-size: 10.5pt; margin-top: 4px;">Observation / Suggestions</div>
    <div class="eval-obs-box"></div>

    <div class="eval-signature-row">
      <div>
        <p style="font-weight: bold; margin-bottom: 22px;">Name of the Staff</p>
        <p style="margin: 0 0 15px 0;">1. Dr. C. Murale</p>
        <p style="margin: 0;">2. Mr. Y. M. Ismankhan</p>
      </div>
      <div style="text-align: right;">
        <p style="font-weight: bold; margin-bottom: 40px;">Signature of the Staff</p>
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
        <tr><td>6</td><td>Interactive Dashboard</td><td style="text-align: center;">8</td></tr>
        <tr><td>7</td><td>Advanced Registration</td><td style="text-align: center;">9</td></tr>
        <tr><td>8</td><td>Wallet and Tournament Queue</td><td style="text-align: center;">9</td></tr>
        <tr><td>9</td><td>Event-driven Tournament Center</td><td style="text-align: center;">10</td></tr>
        <tr><td>10</td><td>Tournament Center</td><td style="text-align: center;">11</td></tr>
        <tr><td>11</td><td>Reports and Insights</td><td style="text-align: center;">11</td></tr>
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
        <tr><td>12</td><td>PHP Backend and User Management</td><td style="text-align: center;">12</td></tr>
        <tr><td>13</td><td>Database Design</td><td style="text-align: center;">12</td></tr>
        <tr><td>14</td><td>Website Analyzer</td><td style="text-align: center;">13</td></tr>
        <tr><td>15</td><td>Responsive Design, Accessibility and Security</td><td style="text-align: center;">14</td></tr>
        <tr><td>16</td><td>Experiment Implementation Details I</td><td style="text-align: center;">14</td></tr>
        <tr><td>17</td><td>Experiment Implementation Details II</td><td style="text-align: center;">15</td></tr>
        <tr><td>18</td><td>Testing and Verification</td><td style="text-align: center;">15</td></tr>
        <tr><td>19</td><td>XAMPP Runtime Environment</td><td style="text-align: center;">16</td></tr>
        <tr><td>20</td><td>Local Server and Source-Control Workflow</td><td style="text-align: center;">16</td></tr>
        <tr><td>21</td><td>Database Evidence — Operatives and Tournament Roster</td><td style="text-align: center;">17</td></tr>
        <tr><td>22</td><td>Database Evidence — Scores and Users</td><td style="text-align: center;">18</td></tr>
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
      Core principle: realistic full-stack engineering, simulated tournament data and explicit safety boundaries.
    </div>

    <h2 class="sec-heading">1. INTRODUCTION</h2>
    <p>
      LastZone is a full-stack online tournament management system created as an academic simulation. It presents the visual 
      and operational flow of a modern esports competition platform while deliberately avoiding commercial paywalls, real money betting 
      and unauthenticated data submission. The application combines a professional user interface with browser APIs, a PHP backend, a 
      relational MySQL database and repeatable tests.
    </p>
    <p>
      The project is designed as a single evolving product instead of nine unrelated laboratory exercises. Semantic HTML 
      becomes a responsive dashboard; JavaScript adds state and events; PHP/MySQL introduces persistent CRUD; and 
      jQuery/AJAX completes the dynamic tournament experience.
    </p>

    <h3 class="sec-subheading">1.1 Problem Statement</h3>
    <p>
      Tournament applications contain many connected journeys: account creation, profile monitoring, bracket transfers, score entries, 
      cadet management, tournament search and reporting. Demonstrating these journeys safely in a classroom requires realistic 
      interactions without collecting actual personal financial information.
    </p>

    <h3 class="sec-subheading">1.2 Proposed Solution</h3>
    <p>
      LastZone provides a coherent gaming environment with reusable components, visible validation, clear status 
      feedback and security boundaries. All gamer tags, scores, tournament references and contact details are demo data.
    </p>

    <h2 class="sec-heading">2. ABSTRACT, OBJECTIVES AND SCOPE</h2>
    <h3 class="sec-subheading">2.1 Abstract</h3>
    <p>
      The system implements a responsive esports interface that demonstrates tournament queue management, simulated combat match entries, 
      roster organization, registered cadets, JSON-backed matches, reports, PHP/MySQL user administration and guarded 
      web-page analysis. Shared navigation and visual tokens make the individual experiments feel like one deployable 
      application.
    </p>

    <h3 class="sec-subheading">2.2 Objectives</h3>
    <ul>
      <li>Develop an accessible, responsive interface with semantic HTML and a maintainable CSS design system.</li>
      <li>Demonstrate event-driven JavaScript, drag/drop, Web Storage, jQuery and AJAX.</li>
      <li>Implement validated PHP endpoints and relational MySQL CRUD using PDO prepared statements.</li>
      <li>Provide a guarded analyzer for public webpages with clear error handling.</li>
      <li>Document installation, testing, Git workflow and day-to-day operation.</li>
    </ul>

    <h3 class="sec-subheading">2.3 Scope</h3>
    <p>
      The scope is limited to academic demonstration. Authentication, real payment processing, commercial payment gateways, 
      settlement, production audit trails and credit card data storage are intentionally excluded.
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
        <tr><td>Laboratory experiments represented</td><td>9</td></tr>
        <tr><td>Primary application screens</td><td>8</td></tr>
        <tr><td>Relational database tables</td><td>4</td></tr>
        <tr><td>AJAX JSON records</td><td>8</td></tr>
        <tr><td>Automated smoke-test checks</td><td>34</td></tr>
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
      Design language: a dark navy tactical palette, blue action color, cyan accents, rounded cards, strong focus states and consistent 
      typography across every module.
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
        <tr><td>Structure</td><td>HTML5</td><td>Semantic landmarks, forms, tables, native validation and accessible controls.</td></tr>
        <tr><td>Presentation</td><td>CSS3</td><td>Variables, Grid, Flexbox, responsive breakpoints, animation and print styling.</td></tr>
        <tr><td>Client logic</td><td>JavaScript</td><td>Counters, theme, events, drag/drop, Web Storage and interactive state.</td></tr>
        <tr><td>Dynamic UI</td><td>jQuery 3.7.1</td><td>Selection, filtering, delegated events and AJAX rendering.</td></tr>
        <tr><td>Data exchange</td><td>JSON / AJAX</td><td>Eight fictional tournament match records loaded over HTTP.</td></tr>
        <tr><td>Server</td><td>PHP 8.1+</td><td>Validation, CRUD, JSON API, uploads and website analysis.</td></tr>
        <tr><td>Database</td><td>MySQL 8 / PDO</td><td>Users, scores, tournament rosters and matches with relational constraints.</td></tr>
        <tr><td>Runtime</td><td>XAMPP / PHP server</td><td>Local Apache, PHP and MySQL development environment.</td></tr>
        <tr><td>Quality</td><td>Node.js smoke test</td><td>Dependency-free verification of files, data and required implementations.</td></tr>
        <tr><td>Version control</td><td>Git / GitHub</td><td>Source history and public project repository.</td></tr>
      </tbody>
    </table>

    <h2 class="sec-heading">4. SYSTEM ARCHITECTURE</h2>
    <div class="three-col-arch">
      <div class="arch-box">
        <h4>PRESENTATION</h4>
        <p>HTML screens</p>
        <p>Shared CSS</p>
        <p>Responsive layout</p>
        <p>Accessible controls</p>
        <p style="font-size: 8pt; color: #555; margin-top: 5px;">Home · Dashboard · Registration · Wallet · Tournament · Scores · Reports</p>
      </div>
      <div class="arch-box">
        <h4>CLIENT LOGIC</h4>
        <p>JavaScript modules</p>
        <p>jQuery selectors</p>
        <p>AJAX requests</p>
        <p>Web Storage</p>
        <p style="font-size: 8pt; color: #555; margin-top: 5px;">DOM events → state update → visible feedback</p>
      </div>
      <div class="arch-box">
        <h4>SERVER & DATA</h4>
        <p>PHP endpoints</p>
        <p>PDO prepared SQL</p>
        <p>MySQL database</p>
        <p>Public-page analyzer</p>
        <p style="font-size: 8pt; color: #555; margin-top: 5px;">Validated request → prepared query → escaped response</p>
      </div>
    </div>

    <h3 class="sec-subheading">4.1 Request Flow</h3>
    <p>
      The browser renders static modules and performs local interactions immediately. AJAX loads JSON or calls PHP 
      endpoints over HTTP. PHP validates input, uses environment-based database configuration and accesses MySQL 
      through PDO. Responses are escaped for HTML or encoded as JSON before returning to the browser.
    </p>

    <h3 class="sec-subheading">4.2 Folder Organization</h3>
    <p>
      The project separates concerns into css/, js/, data/, php/, database/, images/, screenshots/ and tests/. Root-level pages 
      compose the user experience, while reusable assets keep behavior and visual styling consistent.
    </p>

    <h3 class="sec-subheading">4.3 Data Boundaries</h3>
    <p>
      Temporary notes use sessionStorage; tournament queues and theme preference use localStorage; AJAX examples use a 
      versioned JSON file; user and tournament score records use MySQL. This separation makes storage lifetimes and trust 
      boundaries explicit.
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
      The landing page introduces the platform, developers, feature set, safety boundary and shared navigation.
    </p>
    <div class="fig-container">
      <img src="${homePage}" style="max-height: 100mm;" alt="LastZone Home Page">
      <div class="fig-caption">Figure 5.1 — LastZone home page captured from http://localhost:8000/</div>
    </div>
    <p>
      The hero communicates the tournament-management theme without implying real gambling. Statistics, service cards, 
      project identity, experiment modules, security guidance and academic contact areas continue below the fold.
    </p>

    <h2 class="sec-heading">6. INTERACTIVE DASHBOARD</h2>
    <p>
      The dashboard consolidates player rank, match totals, win rate, pending tournament queues, quick actions 
      and monthly progression goals.
    </p>
    <div class="fig-container">
      <img src="${unityGame}" style="max-height: 98mm;" alt="Interactive Dashboard">
      <div class="fig-caption">Figure 6.1 — Interactive dashboard with fictional live tournament metrics</div>
    </div>

    <div class="page-footer-num">8</div>
  </div>
</div>

<!-- ================= PAGE 9: REGISTRATION & TOURNAMENT QUEUE ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <p>
      JavaScript initializes the live greeting and date, updates visual counters, persists the theme and supports notifications 
      and quick actions. The displayed name and balances are fictional demonstration data.
    </p>

    <h2 class="sec-heading">7. ADVANCED REGISTRATION</h2>
    <p>
      The registration module demonstrates native HTML5 controls, validation constraints and an accessible information 
      hierarchy.
    </p>
    <div class="fig-container">
      <img src="${registerForm}" style="max-height: 98mm;" alt="Registration Screen">
      <div class="fig-caption">Figure 7.1 — Advanced profile registration screen</div>
    </div>
    <p>
      The form uses email, telephone, date, time, number and file controls together with required, pattern, min/max and 
      file-type rules. Client feedback improves usability, while PHP repeats validation before any database change.
    </p>

    <h2 class="sec-heading">8. WALLET AND TOURNAMENT QUEUE</h2>
    <p>
      The tournament experiment combines drag/drop interaction with persistent and temporary browser storage.
    </p>
    <div class="fig-container">
      <img src="${weaponInspection}" style="max-height: 98mm;" alt="Tournament Queue Lab">
      <div class="fig-caption">Figure 8.1 — Tournament balance, progress indicators and match queue</div>
    </div>
    <p>
      Services can be dragged into a queue or added by keyboard. Save and Retrieve demonstrate localStorage persistence 
      across reloads; the temporary note demonstrates sessionStorage for the current browser tab.
    </p>

    <div class="page-footer-num">9</div>
  </div>
</div>

<!-- ================= PAGE 10: EVENT-DRIVEN TOURNAMENT CENTER ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="fig-caption" style="margin-bottom: 6px;">Figure 8.2 — Asset inspection and equipment allocation interface</div>
    <div class="fig-container">
      <img src="${spartanArmor}" style="max-height: 105mm;" alt="Asset Inspection">
    </div>

    <h2 class="sec-heading">9. EVENT-DRIVEN TOURNAMENT CENTER</h2>
    <p>
      Matches, brackets, simulation scoring and roster members share an event-driven interface.
    </p>
    <div class="fig-container">
      <img src="${gameplay}" style="max-height: 100mm;" alt="Event Driven Gameplay">
      <div class="fig-caption">Figure 9.1 — Event-driven tournament match and operative center</div>
    </div>
    <p>
      The module handles click, hover, input, change, submit, blur, keydown and double-click events. Delegated controls 
      continue to work for dynamically created operatives, and form submission generates fictional tournament feedback 
      only.
    </p>

    <div class="page-footer-num">10</div>
  </div>
</div>

<!-- ================= PAGE 11: TOURNAMENT CENTER & REPORTS ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">10. TOURNAMENT CENTER</h2>
    <p>
      The jQuery tournament center demonstrates selection, compound filtering, dynamic records and AJAX loading.
    </p>
    <div class="fig-container">
      <img src="${leaderboard}" style="max-height: 105mm;" alt="Tournament Center">
      <div class="fig-caption">Figure 10.1 — Searchable and filterable tournament match center</div>
    </div>
    <p>
      Every record has a unique identifier, class and data attributes. Users can inspect one record, highlight a category, 
      combine type/status/amount filters, add or remove a fictional item and load eight JSON records with a retry path.
    </p>

    <h2 class="sec-heading">11. REPORTS AND INSIGHTS</h2>
    <p>
      The report screen summarizes fictional score outflow, movement, completed matches, win rate and category distribution.
    </p>

    <div class="page-footer-num">11</div>
  </div>
</div>

<!-- ================= PAGE 12: PHP BACKEND & DATABASE DESIGN ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <p>
      Responsive charts and KPI cards translate the shared tournament data into readable trends. A print stylesheet removes 
      unnecessary navigation and produces a clean submission-friendly report view.
    </p>

    <h2 class="sec-heading">12. PHP BACKEND AND USER MANAGEMENT</h2>
    <p>
      PHP endpoints supply validated persistence and administrative CRUD while preserving the same visual system.
    </p>
    <div class="fig-container">
      <img src="${backendApi}" style="max-height: 95mm;" alt="Backend User Management">
      <div class="fig-caption">Figure 12.1 — MySQL-backed User Management screen</div>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 25%;">ENDPOINT</th>
          <th style="width: 75%;">RESPONSIBILITY</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>php/register.php</td><td>Validate fields, prevent duplicates, hash passwords, restrict uploads and INSERT.</td></tr>
        <tr><td>php/users.php</td><td>SELECT demo profiles and render the administration table.</td></tr>
        <tr><td>php/update_user.php</td><td>View and UPDATE a selected user through prepared statements.</td></tr>
        <tr><td>php/delete_user.php</td><td>POST-only, CSRF-protected prepared DELETE.</td></tr>
        <tr><td>php/transactions.php</td><td>Return MySQL tournament data as JSON.</td></tr>
        <tr><td>php/config.php</td><td>Environment-based PDO connection, escaping and CSRF helpers.</td></tr>
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
        <tr><td>users</td><td>Profile and academic information</td><td>Unique email/phone; ten-digit phone check; password hash.</td></tr>
        <tr><td>transactions</td><td>Tournament activity and references</td><td>FK to users; positive amount; unique reference; status enum; indexes.</td></tr>
        <tr><td>beneficiaries</td><td>Saved fictional operatives/recipients</td><td>FK to users; unique account identifier per user.</td></tr>
        <tr><td>bills</td><td>Tournament fee & match queue</td><td>FK to users; positive amount; due-date and status indexes.</td></tr>
      </tbody>
    </table>

    <div class="page-footer-num">12</div>
  </div>
</div>

<!-- ================= PAGE 13: RELATIONSHIPS & WEBSITE ANALYZER ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <div class="callout-box">
      Configuration: database credentials are read from LASTZONE_DB_* environment variables. Credentials and uploaded 
      profile images are excluded from version control.
    </div>

    <h3 class="sec-subheading">13.1 Relationship Model</h3>
    <p>
      One user can own many tournament scores, operatives and match bills. Foreign keys use cascading delete and update behavior so 
      dependent demo records remain consistent. utf8mb4 supports full Unicode text.
    </p>

    <h3 class="sec-subheading">13.2 Data Integrity</h3>
    <p>
      Unique keys prevent duplicate identity fields and tournament references. CHECK constraints reject invalid phone or 
      amount values. Indexes support common user/date and status lookups.
    </p>

    <h3 class="sec-subheading">13.3 Fictional Seed Data</h3>
    <p>
      The schema supplies five demo users, eight tournament records, four operatives and five match queues. All names, addresses, 
      references and scores are fictional and use example.test-style addresses.
    </p>

    <h2 class="sec-heading">14. WEBSITE ANALYZER</h2>
    <p>
      The analyzer inspects public HTML metadata and resources while applying strict network and content controls.
    </p>
    <div class="fig-container">
      <img src="${loginForm}" style="max-height: 98mm;" alt="Website Analyzer Screen">
      <div class="fig-caption">Figure 14.1 — LastZone guarded website analyzer</div>
    </div>
    <p>
      The PHP engine validates HTTP(S) URLs, resolves every destination and redirect, blocks private or reserved network 
      targets, verifies TLS, enforces time and body-size limits and accepts HTML content only. DOMDocument and XPath 
      extract title, description, keywords, headings, links, images, stylesheets, scripts and forms.
    </p>

    <div class="callout-box">
      Security boundary: the analyzer is a learning tool for small public pages. It does not execute fetched scripts and must not be 
      used to access private-network resources.
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
      CSS variables, Grid and Flexbox create consistent layouts at desktop, tablet and mobile sizes. Breakpoints reorganize 
      navigation, cards, forms, tables and tournament panels without horizontal page overflow. Print rules support clean 
      report output.
    </p>

    <h3 class="sec-subheading">15.2 Accessibility</h3>
    <p>
      Semantic landmarks, visible labels, skip navigation, keyboard-operable controls, focus indicators, meaningful 
      alternative text and reduced-motion support improve access. Drag/drop actions have keyboard alternatives and 
      messages provide visible status feedback.
    </p>

    <h3 class="sec-subheading">15.3 Security Controls</h3>
    <ul>
      <li>PDO emulated prepares are disabled and every mutation uses bound prepared statements.</li>
      <li>Passwords are hashed; duplicate email and phone values are checked server-side.</li>
      <li>CSRF tokens protect user update/delete operations and mutations use POST.</li>
      <li>Image uploads are restricted by type and size, renamed randomly and ignored by Git.</li>
      <li>The website analyzer blocks SSRF-style private targets and constrains redirects, time and size.</li>
      <li>Output is escaped and the project explicitly rejects real payment secrets.</li>
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
        <tr><td>1</td><td>index.html</td><td>Semantic header/nav/main/sections/footer, eight statistics, lists, form, module table and contact.</td></tr>
        <tr><td>2</td><td>style.css, main.js, dashboard.js</td><td>Grid/Flexbox, animations, live date/time, counters, theme, notifications, slider and validation.</td></tr>
        <tr><td>3</td><td>register.html</td><td>Specialized HTML5 controls, constraints, contenteditable, spellcheck and accessible validation.</td></tr>
        <tr><td>4</td><td>wallet.html, storage.js</td><td>dragstart/dragover/drop, keyboard add, localStorage, sessionStorage and queue controls.</td></tr>
        <tr><td>5</td><td>Shared CSS and all screens</td><td>Breakpoints, pseudo-elements, transforms, transitions, progress bars, tooltips and print output.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">Demonstration Sequence</h3>
    <ul>
      <li>Open Home and identify semantic regions, statistics, lists, forms and tables.</li>
      <li>Toggle the theme, notifications and responsive navigation; observe persisted preference.</li>
      <li>Submit invalid registration fields to demonstrate browser constraints.</li>
      <li>Add services to the tournament queue, save, reload and retrieve.</li>
      <li>Resize the viewport to desktop, tablet and mobile widths and inspect layout changes.</li>
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
        <tr><td>6</td><td>payments.html, events.js</td><td>Eight event types, preventDefault, delegation, operative filtering and fictional tournament feedback.</td></tr>
        <tr><td>7</td><td>database/, php/</td><td>Schema import, validated registration and prepared INSERT/SELECT/UPDATE/DELETE.</td></tr>
        <tr><td>8</td><td>analyzer.php, php/analyzer.php</td><td>Public URL inspection, metadata extraction, URL resolution and guarded error handling.</td></tr>
        <tr><td>9</td><td>transactions.html, jquery-app.js, JSON</td><td>Selection, group highlighting, filters, dynamic add/remove and $.ajax loading with Retry.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">Demonstration Sequence</h3>
    <ul>
      <li>Search and favorite an operative, add a dynamic competitor and submit a demo match.</li>
      <li>Register a fictional user, then view, edit and delete it from User Management.</li>
      <li>Analyze a small public page, followed by malformed and unreachable URL cases.</li>
      <li>Select tournament cards, combine filters, add/remove a record and reload JSON through AJAX.</li>
    </ul>

    <div class="callout-box">
      Automated result: LastZone smoke tests passed (34 checks).
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
        <tr><td>Required files</td><td>25 key pages/assets/endpoints</td><td>Every required file exists.</td></tr>
        <tr><td>JSON</td><td>Array shape and six required fields</td><td>Eight complete records parse successfully.</td></tr>
        <tr><td>Events</td><td>addEventListener and no inline onclick</td><td>Event-driven implementation confirmed.</td></tr>
        <tr><td>Storage</td><td>localStorage, sessionStorage and drop</td><td>Both lifetimes and drag/drop are present.</td></tr>
        <tr><td>jQuery</td><td>$.ajax and delegated selection</td><td>Dynamic AJAX behavior confirmed.</td></tr>
        <tr><td>SQL</td><td>Users table and foreign keys</td><td>Schema and relationships confirmed.</td></tr>
        <tr><td>PHP</td><td>prepare() in CRUD/API files</td><td>Prepared statements confirmed.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">18.1 Manual Verification</h3>
    <ul>
      <li>Form errors: empty, malformed email, short phone, invalid amounts and short passwords.</li>
      <li>Browser behavior: theme, clock, counters, notifications, slider, queue and storage lifetime.</li>
      <li>Backend: database import, duplicate rejection, update/delete cancellation and database-offline message.</li>
      <li>Analyzer: valid page, malformed URL, blocked private address, non-HTML, timeout and large response.</li>
      <li>AJAX: successful load, missing/invalid JSON error state and Retry behavior.</li>
    </ul>

    <div class="page-footer-num">15</div>
  </div>
</div>

<!-- ================= PAGE 16: RUNTIME & WORKFLOW ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">19. XAMPP RUNTIME ENVIRONMENT</h2>
    <p>
      XAMPP provides the local Apache, PHP and MySQL services used for full-stack development and demonstration.
    </p>
    
    <div class="terminal-box">
      <strong>XAMPP Control Panel v3.3.0 Status:</strong><br>
      [Apache]&nbsp;&nbsp;Port(s): 80, 443 &nbsp;&nbsp;|&nbsp; Status: running (PID: 32244, 34596)<br>
      [MySQL]&nbsp;&nbsp;&nbsp;Port(s): 3306 &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp; Status: running (PID: 1212)<br>
      Control Panel Ready. Attempting to start Apache app... Status change detected: running.<br>
      Attempting to start MySQL app... Status change detected: running.
    </div>
    
    <div class="fig-caption">Figure 19.1 — Supplied XAMPP Control Panel evidence showing Apache and MySQL running</div>
    <p>
      The evidence shows Apache on ports 80/443 and MySQL on port 3306. Tomcat is also running on port 8080 but is not 
      required by LastZone. For this project, Apache/PHP serves the pages and endpoints while MySQL stores persistent 
      user, tournament, operative and score data.
    </p>

    <h2 class="sec-heading">20. LOCAL SERVER AND SOURCE-CONTROL WORKFLOW</h2>
    <p>
      The application is served locally by PHP and uses Git/GitHub for source history and submission.
    </p>
    
    <div class="terminal-box">
      Windows PowerShell<br>
      Copyright (C) Microsoft Corporation. All rights reserved.<br><br>
      PS C:\\Users\\dharani&gt; cd E:\\naveen<br>
      PS E:\\naveen&gt; C:\\xampp\\php\\php.exe -S 127.0.0.1:8000<br>
      [Thu Oct 15 21:30:00 2026] PHP 8.2.12 Development Server (http://127.0.0.1:8000) started
    </div>
    
    <div class="fig-caption">Figure 20.1 — Supplied PowerShell evidence: PHP 8.2.12 development server on 127.0.0.1:8000</div>

    <div class="page-footer-num">16</div>
  </div>
</div>

<!-- ================= PAGE 17: DATABASE EVIDENCE I ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <p>
      The command window confirms that the working directory is the LastZone project and that PHP serves the 
      application at http://127.0.0.1:8000. Git records local changes, while the public repository preserves the submitted 
      source structure: CSS, JavaScript, PHP, database, JSON data, images, screenshots and tests.
    </p>
    <p>
      <strong>Repository:</strong> https://github.com/urwishservice-max/lastone-tournament
    </p>

    <h2 class="sec-heading">21. DATABASE EVIDENCE — OPERATIVES AND TOURNAMENT ROSTER</h2>
    <p>
      The supplied phpMyAdmin screens confirm that the implemented relational schema contains persisted demonstration 
      records.
    </p>
    <div class="fig-container">
      <img src="${pmaRanks}" style="max-height: 85mm;" alt="Tournament Roster in PMA">
      <div class="fig-caption">Figure 21.1 — Operatives table with user relationships and tournament callsigns</div>
    </div>
    <div class="fig-container">
      <img src="${pmaScores}" style="max-height: 85mm;" alt="Tournament Scores in PMA">
      <div class="fig-caption">Figure 21.2 — Match scores table with scores, positive kills, waves and status values</div>
    </div>

    <div class="page-footer-num">17</div>
  </div>
</div>

<!-- ================= PAGE 18: DATABASE EVIDENCE II & ADVANTAGES ================= -->
<div class="page">
  <div class="outer-border"></div>
  <div class="page-inner">
    <h2 class="sec-heading">22. DATABASE EVIDENCE — SCORES AND USERS</h2>
    <p>
      The database stores fictional tournament activity and user profiles; password values are hashes rather than plain text.
    </p>
    <div class="fig-container">
      <img src="${pmaUsers}" style="max-height: 105mm;" alt="Users in PMA">
      <div class="fig-caption">Figure 22.1 — Users table with unique identity fields and hashed passwords</div>
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
        <tr><td>One coherent product for nine experiments</td><td>No real money payment processing</td></tr>
        <tr><td>Responsive, keyboard-aware interface</td><td>No production authentication</td></tr>
        <tr><td>Prepared CRUD and guarded analyzer</td><td>Local PHP/MySQL services required</td></tr>
        <tr><td>Repeatable 34-check smoke test</td><td>No bank or UPI integration</td></tr>
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
        <tr><td>localhost does not open</td><td>Start Apache/PHP and confirm the port.</td></tr>
        <tr><td>User Management fails</td><td>Start MySQL and import lastzone_db.sql.</td></tr>
        <tr><td>AJAX records do not load</td><td>Use HTTP rather than file://.</td></tr>
        <tr><td>Analyzer rejects a URL</td><td>Use a public HTTP(S) HTML page.</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading">23.2 Conclusion</h3>
    <p>
      LastZone successfully combines semantic structure, responsive design, browser interaction, persistent storage, 
      jQuery/AJAX, PHP/MySQL CRUD and guarded server-side analysis in one safe academic tournament-management 
      system.
    </p>

    <h3 class="sec-subheading">23.3 Future Enhancements</h3>
    <ul>
      <li>Add authenticated sessions, roles, audit logs and rate limiting.</li>
      <li>Introduce migrations, CI integration and browser tests.</li>
      <li>Provide containerized deployment, HTTPS and structured monitoring.</li>
      <li>Add localization and accessible CSV/PDF exports.</li>
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
        <tr><td style="text-align: center;">1</td><td>Start XAMPP</td><td>Start Apache and MySQL; wait for green status labels.</td></tr>
        <tr><td style="text-align: center;">2</td><td>Open PowerShell</td><td>Use E:\naveen.</td></tr>
        <tr><td style="text-align: center;">3</td><td>Start port 8000</td><td>Run php -S 127.0.0.1:8000 when using the PHP development server.</td></tr>
        <tr><td style="text-align: center;">4</td><td>Open LastZone</td><td>Browse to http://localhost:8000/.</td></tr>
        <tr><td style="text-align: center;">5</td><td>Verify backend</td><td>Open User Management and confirm MySQL records load.</td></tr>
        <tr><td style="text-align: center;">6</td><td>Run checks</td><td>Execute npm test and confirm 34 checks pass.</td></tr>
        <tr><td style="text-align: center;">7</td><td>Stop safely</td><td>Use Ctrl+C for the PHP server; stop XAMPP services when no longer needed.</td></tr>
      </tbody>
    </table>

    <p style="font-size: 9.5pt; margin-top: 5px;">
      If the page does not load, first confirm the correct web server is running, then check the selected port and the 
      PowerShell output. Do not delete the database, project folder or MySQL data during normal recovery.
    </p>

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
        <tr><td style="text-align: center;">1</td><td>MDN Web Docs — HTML forms, CSS layout, JavaScript events, Drag and Drop, and Web Storage.</td></tr>
        <tr><td style="text-align: center;">2</td><td>PHP Manual — PDO, password hashing, cURL, DOMDocument and secure upload handling.</td></tr>
        <tr><td style="text-align: center;">3</td><td>MySQL 8.0 Reference Manual — constraints, indexes, foreign keys and transactions.</td></tr>
        <tr><td style="text-align: center;">4</td><td>jQuery API Documentation — selectors, delegated events and $.ajax.</td></tr>
        <tr><td style="text-align: center;">5</td><td>OWASP guidance — input validation, CSRF prevention, output encoding, SSRF prevention and file uploads.</td></tr>
        <tr><td style="text-align: center;">6</td><td>Git and GitHub documentation — commits, remotes, branches and repository hygiene.</td></tr>
        <tr><td style="text-align: center;">7</td><td>LastZone project source and README — https://github.com/urwishservice-max/lastone-tournament</td></tr>
      </tbody>
    </table>

    <h3 class="sec-subheading" style="margin-top: 12px;">REPOSITORY ARTIFACTS</h3>
    <table class="report-table">
      <thead>
        <tr>
          <th style="width: 30%;">ARTIFACT</th>
          <th style="width: 70%;">LOCATION / DESCRIPTION</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Project repository</td><td>https://github.com/urwishservice-max/lastone-tournament</td></tr>
        <tr><td>Primary documentation</td><td>README.md</td></tr>
        <tr><td>Frontend source</td><td>Root HTML pages, css/ and js/</td></tr>
        <tr><td>Backend source</td><td>analyzer.php and php/ endpoints</td></tr>
        <tr><td>Database</td><td>database/lastzone.sql</td></tr>
        <tr><td>JSON data</td><td>data/transactions.json</td></tr>
        <tr><td>Automated verification</td><td>tests/smoke-test.mjs</td></tr>
      </tbody>
    </table>

    <div class="callout-box" style="margin-top: 18px;">
      This report was prepared from the implemented LastZone repository, the running local application and the supplied 
      XAMPP and GitHub evidence. Completed work is separated from proposed production enhancements.
    </div>

    <div class="page-footer-num">20</div>
  </div>
</div>

</body>
</html>
`;

const outPath = path.join(__dirname, 'report_team_cit.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log('Team report HTML generated successfully at', outPath, 'Length:', html.length);
