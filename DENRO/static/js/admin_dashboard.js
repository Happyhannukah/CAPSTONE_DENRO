document.addEventListener("DOMContentLoaded", function() {
  // User Distribution Chart
  const userChartCtx = document.getElementById('userChart');
  if (userChartCtx) {
    new Chart(userChartCtx, {
      type: 'bar',
      data: {
        labels: ['Admins', 'PENRO', 'CENRO', 'Evaluators'],
        datasets: [{
          label: 'Counts',
          data: [
            parseInt(userChartCtx.dataset.admins) || 0,
            parseInt(userChartCtx.dataset.penros) || 0,
            parseInt(userChartCtx.dataset.cenros) || 0,
            parseInt(userChartCtx.dataset.evaluators) || 0
          ],
          backgroundColor: ['#20c997', '#0d6efd', '#6f42c1', '#fd7e14'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: false }
        },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  // Account Status Doughnut Chart
  const accountStatusCtx = document.getElementById('accountStatusChart');
  if (accountStatusCtx) {
    new Chart(accountStatusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected', 'Deactivated'],
        datasets: [{
          data: [
            parseInt(accountStatusCtx.dataset.approved) || 0,
            parseInt(accountStatusCtx.dataset.pending) || 0,
            parseInt(accountStatusCtx.dataset.rejected) || 0,
            parseInt(accountStatusCtx.dataset.deactivated) || 0
          ],
          backgroundColor: ['#20c997', '#dc3545', '#6c757d', '#ffc107']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: false }
        }
      }
    });
  }

  // Notifications toggle
  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      notifDropdown.style.display =
        notifDropdown.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", function(event) {
      if (!notifBtn.contains(event.target) && !notifDropdown.contains(event.target)) {
        notifDropdown.style.display = "none";
      }
    });
  }
});
