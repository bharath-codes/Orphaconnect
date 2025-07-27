async function fetchOverview() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/admin/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("admin-data").innerHTML = `
        <ul>
          <li><strong>Total Users:</strong> ${data.users}</li>
          <li><strong>Donations:</strong> ${data.donations}</li>
          <li><strong>Blood Requests:</strong> ${data.blood_requests}</li>
          <li><strong>Food Listings:</strong> ${data.food_listings}</li>
        </ul>`;
    } else {
      document.getElementById("admin-data").innerText = data.message || "Unauthorized";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("admin-data").innerText = "Error loading data";
  }
}

// Auto load on page open
document.addEventListener("DOMContentLoaded", fetchOverview);
