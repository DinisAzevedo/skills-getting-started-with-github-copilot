document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupButton = signupForm.querySelector('button[type="submit"]');
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createParticipantItem(activityName, participantEmail) {
    const participantItem = document.createElement("li");
    participantItem.className = "participant-item";

    const participantText = document.createElement("span");
    participantText.textContent = participantEmail;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "unregister-btn";
    removeButton.setAttribute("aria-label", `Remove ${participantEmail}`);
    removeButton.dataset.activity = activityName;
    removeButton.dataset.email = participantEmail;
    removeButton.innerHTML = "&#128465;";

    participantItem.appendChild(participantText);
    participantItem.appendChild(removeButton);
    return participantItem;
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML =
      '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;
      const participants = details.participants || [];
      const participantCountLabel =
        participants.length === 1 ? "student" : "students";

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-section">
          <p class="participants-title"><strong>Participants (${participants.length} ${participantCountLabel})</strong></p>
        </div>
      `;

      const participantsSection = activityCard.querySelector(
        ".participants-section",
      );

      if (participants.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "participants-empty";
        emptyState.textContent = "No students signed up yet.";
        participantsSection.appendChild(emptyState);
      } else {
        const participantList = document.createElement("ul");
        participantList.className = "participants-list";

        participants.forEach((participantEmail) => {
          participantList.appendChild(
            createParticipantItem(name, participantEmail),
          );
        });

        participantsSection.appendChild(participantList);
      }

      activitiesList.appendChild(activityCard);

      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  async function unregisterParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister student. Please try again.", "error");
      console.error("Error unregistering student:", error);
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      renderActivities(activities);
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    signupButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        },
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    } finally {
      signupButton.disabled = false;
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const clickedElement = event.target;
    const button = clickedElement.closest(".unregister-btn");

    if (!button) {
      return;
    }

    const activity = button.dataset.activity;
    const email = button.dataset.email;

    if (!activity || !email) {
      return;
    }

    await unregisterParticipant(activity, email);
  });

  // Initialize app
  fetchActivities();
});
