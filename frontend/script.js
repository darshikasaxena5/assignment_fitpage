const API_BASE = 'https://ratings-review-system.onrender.com';

// --- Cache for users and products (ID→name mapping) ---
let usersCache = {};
let productsCache = {};

// Cache fill function
function cacheUsersProducts(callback) {
  Promise.all([
    fetch(`${API_BASE}/users`).then(res => res.json()),
    fetch(`${API_BASE}/products`).then(res => res.json())
  ]).then(([users, products]) => {
    usersCache = {};
    productsCache = {};
    users.forEach(u => usersCache[u.id] = u.name);
    products.forEach(p => productsCache[p.id] = p.name);
    if (callback) callback();
  });
}

// --- Calculate Percent Liked (feature code) ---
function calculateLikePercentage(reviews) {
  if (!reviews.length) return 0;
  // Positive: rating >= 4
  const positive = reviews.filter(r => Number(r.rating) >= 4).length;
  return Math.round((positive / reviews.length) * 100);
}

// --- Load Products with avg stars + percent liked ---
function loadProducts() {
  fetch(`${API_BASE}/products`)
    .then(res => res.json())
    .then(data => {
      const prodDiv = document.getElementById('products');
      prodDiv.innerHTML = '';
      if (data.length === 0) {
        prodDiv.textContent = 'No products yet.';
      } else {
        data.forEach(prod => {
          prodDiv.innerHTML += `<div class="card product-card" id="prod-card-${prod.id}">
            <div class="product-name"><strong>${prod.name}</strong></div>
            <div class="product-desc">${prod.description || ''}</div>
            <div class="product-rating-detail" id="avg-rating-${prod.id}"></div>
            <div class="percent-liked" id="percent-liked-${prod.id}" style="color:#00b386;font-weight:600;margin-top:0.4em;"></div>
          </div>`;
        });
      }
      // Dropdown fill
      const prodSelect = document.getElementById('product_id');
      prodSelect.innerHTML = '';
      data.forEach(prod => {
        prodSelect.innerHTML += `<option value="${prod.id}">${prod.name}</option>`;
      });
      // After filling, show avg ratings and percent liked
      data.forEach(prod => {
        loadAvgRating(prod.id);
        loadPercentLiked(prod.id);
      });
    });
}

// --- Calculate and show percent liked (for each product) ---
function loadPercentLiked(productId) {
  fetch(`${API_BASE}/reviews?product_id=${productId}`)
    .then(res => res.json())
    .then(reviews => {
      const percent = calculateLikePercentage(reviews);
      const text = reviews.length === 0
        ? "No reviews yet"
        : `<span style="color:#008d5f;font-weight:600;">${percent}% users liked this product</span>`;
      const percentDiv = document.getElementById(`percent-liked-${productId}`);
      if (percentDiv) percentDiv.innerHTML = text;
    });
}

// --- Users Dropdown Fill ---
function loadUsers() {
  fetch(`${API_BASE}/users`)
    .then(res => res.json())
    .then(data => {
      const userSelect = document.getElementById('user_id');
      userSelect.innerHTML = '';
      data.forEach(user => {
        userSelect.innerHTML += `<option value="${user.id}">${user.name} (ID: ${user.id})</option>`;
      });
    });
}

// --- Reviews Beautifully Rendered ---
function loadReviews() {
  fetch(`${API_BASE}/reviews`)
    .then(res => res.json())
    .then(async data => {
      // Wait till cache ready
      if (Object.keys(usersCache).length === 0 || Object.keys(productsCache).length === 0) {
        setTimeout(loadReviews, 150);
        return;
      }
      const reviewsDiv = document.getElementById('reviews');
      reviewsDiv.innerHTML = '';
      if (data.length === 0) {
        reviewsDiv.textContent = 'No reviews yet.';
      } else {
        data.forEach(rev => {
          // User and Product name from cache
          const userName = usersCache[rev.user_id] || `User ${rev.user_id}`;
          const productName = productsCache[rev.product_id] || `Product ${rev.product_id}`;
          // Stars (for review rating)
          let starsHtml = '';
          for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="avg-rating-star${i <= (rev.rating || 0) ? '' : ' inactive'}">★</span>`;
          }
          reviewsDiv.innerHTML += `<div class="card review-card">
            <div class="review-user"><b style="color:#00b386;">${userName}</b> reviewed <b>${productName}</b></div>
            <div class="review-rating-stars">${starsHtml}</div>
            <div class="review-text">${rev.review_text ? `"${rev.review_text}"` : ''}</div>
            ${rev.photo_url ? `<img src="${rev.photo_url}" class="review-photo" />` : ""}
          </div>`;
        });
      }
    });
}

// --- Average Rating Star Display ---
function loadAvgRating(productId) {
  fetch(`${API_BASE}/reviews?product_id=${productId}`)
    .then(res => res.json())
    .then(reviews => {
      const ratings = reviews.filter(r => r.rating).map(r => Number(r.rating));
      let starsHtml = '';
      let avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="avg-rating-star${i <= Math.round(avg) ? '' : ' inactive'}">★</span>`;
      }
      avg = ratings.length ? avg.toFixed(2) : 'N/A';
      document.getElementById(`avg-rating-${productId}`).innerHTML =
        `<span class="avg-rating-stars">${starsHtml}</span> <b>${avg}</b> (based on ${ratings.length} ratings)`;
    });
}

// --- Review form submit with photo ---
document.getElementById('reviewForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const user_id = Number(document.getElementById('user_id').value);
  const product_id = Number(document.getElementById('product_id').value);
  const rating = Number(document.getElementById('rating').value) || null;
  const review_text = document.getElementById('review_text').value;
  const photo = document.getElementById('photo').files[0];

  const formData = new FormData();
  formData.append('user_id', user_id);
  formData.append('product_id', product_id);
  formData.append('rating', rating);
  formData.append('review_text', review_text);
  if (photo) formData.append('photo', photo);

  fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    showMessage(data.error ? data.error : "Review added!", !!data.error);
    loadReviews();
    loadProducts(); // will also update percent liked
    document.getElementById('reviewForm').reset();
    document.getElementById('photoPreview').style.display = 'none';
  });
});

// --- Photo Preview ---
document.getElementById('photo').addEventListener('change', function() {
  const photoPreview = document.getElementById('photoPreview');
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      photoPreview.src = e.target.result;
      photoPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    photoPreview.style.display = 'none';
  }
});

// --- Toast message ---
function showMessage(msg, isError) {
  const msgDiv = document.getElementById('reviewMessage');
  msgDiv.textContent = msg;
  msgDiv.style.color = isError ? "red" : "green";
  setTimeout(() => { msgDiv.textContent = ""; }, 2500);
}

// --- Initial page load ---
cacheUsersProducts(() => {
  loadProducts();
  loadUsers();
  loadReviews();
});