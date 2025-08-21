document.addEventListener("DOMContentLoaded", () => {
    // Search functionality
    const searchInput = document.querySelector(".topbar input[type='text']");
    const searchButton = document.querySelector(".topbar button");

    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();
        if (query !== "") {
            alert(`Searching for: ${query}`);
            // You can replace this with real search logic or route navigation
        }
    });

    // Notification bell interaction
    const notificationIcon = document.querySelector(".notification");
    notificationIcon.addEventListener("click", () => {
        alert("No new notifications.");
    });

    // Logout confirmation
    const logoutLink = document.querySelector(".logout");
    logoutLink.addEventListener("click", (event) => {
        const confirmLogout = confirm("Are you sure you want to logout?");
        if (!confirmLogout) {
            event.preventDefault(); // Cancel logout
        }
    });

    // Card click behavior (Optional: If you want navigation or modal details)
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", () => {
            const title = card.innerText.split("\n")[0];
            alert(`${title} clicked!`);
        });
    });
});



// cenro_templates

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("enumeratorModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const closeBtn2 = document.getElementById("closeModalBtn2");

  if (!modal || !openBtn) return;

  const openModal = (e) => {
    if (e) e.preventDefault();
    modal.classList.add("show");
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modal.classList.remove("show");
    document.body.classList.remove("modal-open");
  };

  openBtn.addEventListener("click", openModal);
  closeBtn && closeBtn.addEventListener("click", closeModal);
  closeBtn2 && closeBtn2.addEventListener("click", closeModal);

  // Close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Esc
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});