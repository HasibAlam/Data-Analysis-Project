const headerHTML = `
  <header class="project-header">
    <a class="project-brand" href="index.html" aria-label="Traffic Fines Data Story home">
      <span class="brand-icon" aria-hidden="true"><i class="fa-solid fa-chart-line"></i></span>
      <span><strong>Traffic Fines</strong><small>Data Analysis Project</small></span>
    </a>
    <nav class="nav-buttons" aria-label="Primary navigation">
      <a href="index.html" class="btn"><i class="fa-solid fa-house" aria-hidden="true"></i><span>Home</span></a>
      <a href="vis2.html" class="btn"><i class="fa-solid fa-chart-column" aria-hidden="true"></i><span>Dashboard</span></a>
      <a href="story.html" class="btn"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Storyboard</span></a>
      <a href="report.html" class="btn"><i class="fa-solid fa-file-lines" aria-hidden="true"></i><span>Report</span></a>
      <a href="about.html" class="btn"><i class="fa-solid fa-user" aria-hidden="true"></i><span>About Me</span></a>
    </nav>
  </header>`;

const bubbles = Array.from({ length: 12 }, (_, index) => {
  const position = 4 + index * 8.2;
  const size = 2.2 + (index % 4) * 0.7;
  const time = 3.5 + (index % 5) * 0.6;
  const delay = -index * 0.45;
  const distance = 5 + (index % 3) * 2;
  return `<span class="bubble" style="--position:${position}%;--size:${size}rem;--time:${time}s;--delay:${delay}s;--distance:${distance}rem"></span>`;
}).join("");

const footerHTML = `
  <footer class="site-footer">
    <div class="footer-bubbles" aria-hidden="true">${bubbles}</div>
    <div class="footer-content">
      <div class="footer-copy">
        <strong>Hasib Alam</strong>
        <p>Building thoughtful data stories, analytical tools, and full-stack experiences.</p>
      </div>
      <nav class="footer-links" aria-label="Footer links">
        <a href="https://www.linkedin.com/in/hasib-alam-b58987214/" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-linkedin-in" aria-hidden="true"></i><span>LinkedIn</span></a>
        <a href="https://hasibportfolio.netlify.app/" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe" aria-hidden="true"></i><span>Website</span></a>
        <a href="mailto:hasibalamsadat2001@gmail.com"><i class="fa-solid fa-envelope" aria-hidden="true"></i><span>Email</span></a>
        <a href="assets%20folder/Hasib_Alam_Resume.pdf" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i><span>Resume</span></a>
        <a href="https://github.com/HasibAlam" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github" aria-hidden="true"></i><span>GitHub</span></a>
      </nav>
    </div>
  </footer>
  <svg class="footer-filter" aria-hidden="true"><defs><filter id="footer-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="goo"/></filter></defs></svg>`;

window.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector('link[data-font-awesome]')) {
    const icons = document.createElement("link");
    icons.rel = "stylesheet";
    icons.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css";
    icons.referrerPolicy = "no-referrer";
    icons.dataset.fontAwesome = "true";
    document.head.appendChild(icons);
  }

  const headerContainer = document.getElementById("site-header");
  const footerContainer = document.getElementById("site-footer");
  if (headerContainer) headerContainer.innerHTML = headerHTML;
  if (footerContainer) footerContainer.innerHTML = footerHTML;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-buttons a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) link.setAttribute("aria-current", "page");
  });
});
