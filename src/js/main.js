class NutriPlanApp{
  constructor() {
    this.recipesGrid = document.getElementById("recipesGrid");
    this.baseUrl = "https://nutriplan-api.vercel.app/api";

    this.currentMeal = null;
    this.currentNutrition = null;

    this.init();
  }

  async init() {
    await this.fetchAndDisplayMeals("/meals/search?name=");
    await this.fetchCategories();
    await this.fetchAreas();

    this.addCategoryEvents();
    this.addAreaEvents();
    this.addMealEvents();

    this.renderFoodLog();

    document.getElementById("search-input").addEventListener("input", (e) => {
        this.searchMeals(e.target.value);
    });

    document.getElementById("log-meal-btn").addEventListener("click", () => {
      this.addMealToFoodLog();
    });

    document.getElementById("meals-btn").addEventListener("click", () => {
      this.setActiveNav("meals-btn");
      this.showMeals();
    });

    document.getElementById("foodlog-btn").addEventListener("click", () => {
      this.setActiveNav("foodlog-btn");
      this.showFoodLog();
    });

    document.getElementById("products-btn").addEventListener("click", () => {
      this.setActiveNav("products-btn");
      this.showProducts();
    });

    document.getElementById("clear-foodlog").addEventListener("click", () => {
      this.clearFoodLog();
    });

    document.getElementById("search-product-btn").addEventListener("click", () => {
        const query = document
          .getElementById("product-search-input")
          .value.trim();
        if (query) {
          this.searchProducts(query);
        }
      });

    document.getElementById("lookup-barcode-btn").addEventListener("click", () => {
        const code = document.getElementById("barcode-input").value.trim();
        if (code) {
          this.searchByBarcode(code);
        }
      });

  }

  clearFoodLog(){
    localStorage.removeItem("foodLog");
    this.renderFoodLog();
  }

  showMeals(){
    document.getElementById("meal-details").classList.add("hidden");
    document.getElementById("foodlog-section").classList.add("hidden");
    document.getElementById("products-section").classList.add("hidden");

    document.getElementById("all-recipes-section").classList.remove("hidden");
    document
      .getElementById("meal-categories-section")
      .classList.remove("hidden");
    document
      .getElementById("search-filters-section")
      .classList.remove("hidden");
    document.getElementById("areas-grid").style.display = "flex";
    changeHeader(
      "Meals & Recipes",
      "Discover delicious and nutritious recipes tailored for you",
    );

  }

  addMealEvents() {
    this.recipesGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".recipe-card");
      if (!card) return;
      const id = card.dataset.mealId;
      this.showMealDetails(id);
    });
  }

  async showMealDetails(id) {
    const meals = await this.fetchMeals(`/meals/${id}`);
    console.log(meals);
    if (!meals || meals.length === 0) {
      alert("Meal not found");
      return;
    }
    const meal = meals[0];
    document.getElementById("all-recipes-section").classList.add("hidden");
    document.getElementById("meal-details").classList.remove("hidden");
    document.getElementById("areas-grid").style.display = "none";
    document.getElementById("meal-categories-section").style.display = "none";
    document.getElementById("search-filters-section").style.display = "none";
    this.renderMealDetails(meal);
    const nutrition = await this.analyzeNutrition(meal);
    // console.log(nutrition);
    // console.log("Meal:", meal);
    // console.log("Nutrition:", nutrition);
    this.renderNutrition(nutrition);

    this.currentMeal = meal;
    this.currentNutrition = nutrition;

    console.log("Saved Meal:", this.currentMeal);
    console.log("Saved Nutrition:", this.currentNutrition);
  }

  async analyzeNutrition(meal) {
    const response = await fetch(`${this.baseUrl}/nutrition/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "cFfwEE3PGV0MmSVeoJNajw1qee1Can6UdL6uqeQu",
      },
      body: JSON.stringify({
        recipeName: meal.name,
        ingredients: meal.ingredients.map(
          (item) => `${item.measure} ${item.ingredient}`,
        ),
      }),
    });
    const data = await response.json();
    return data.data;
  }

  renderNutrition(nutrition) {
    document.getElementById("hero-calories").textContent =nutrition.perServing.calories + " cal";
    document.getElementById("protein").textContent =nutrition.perServing.protein + " g";
    document.getElementById("fat").textContent =nutrition.perServing.fat + " g";
    document.getElementById("carbs").textContent =nutrition.perServing.carbs + " g";
    document.getElementById("fiber").textContent =nutrition.perServing.fiber + " g";
    document.getElementById("sugar").textContent =nutrition.perServing.sugar + " g";
    document.getElementById("saturated-fat").textContent =nutrition.perServing.saturatedFat + " g";
    document.getElementById("cholesterol").textContent =nutrition.perServing.cholesterol + " mg";
    document.getElementById("sodium").textContent =nutrition.perServing.sodium + " mg";
    document.getElementById("protein-bar").style.width =`${Math.min(nutrition.perServing.protein * 2,100)}%`;
    document.getElementById("carbs-bar").style.width =`${Math.min((nutrition.perServing.carbs / 300) * 100,100)}%`;
    document.getElementById("fat-bar").style.width =`${Math.min((nutrition.perServing.fat / 70) * 100,100)}%`;
    document.getElementById("fiber-bar").style.width =`${Math.min((nutrition.perServing.fiber / 30) * 100,100)}%`;
    document.getElementById("sugar-bar").style.width =`${Math.min((nutrition.perServing.sugar / 50) * 100,100)}%`;
    document.getElementById("herocalories").textContent =nutrition.perServing.calories;
    document.getElementById("total-calories").textContent =`Total: ${nutrition.totals.calories} cal`;
  }

  addMealToFoodLog() {
    console.log(this.currentMeal);
    console.log(this.currentNutrition);
    let foodLog = JSON.parse(localStorage.getItem("foodLog")) || [];
    foodLog.push({
      name: this.currentMeal.name,
      image: this.currentMeal.thumbnail,
      calories: this.currentNutrition.perServing.calories,
      protein: this.currentNutrition.perServing.protein,
      carbs: this.currentNutrition.perServing.carbs,
      fat: this.currentNutrition.perServing.fat,
    });
    localStorage.setItem("foodLog", JSON.stringify(foodLog));
    this.renderFoodLog();
    alert("Meal Added");
  }

  renderFoodLog() {
    const foodLog = JSON.parse(localStorage.getItem("foodLog")) || [];
    const list = document.getElementById("logged-items-list");
    if (foodLog.length === 0) {
      list.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <p>No meals logged today</p>
            </div>`;
      return;
    }
    list.innerHTML = "";
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    foodLog.forEach((item, index) => {
      calories += item.calories;
      protein += item.protein;
      carbs += item.carbs;
      fat += item.fat;
      list.innerHTML += `
            <div class="bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 flex justify-between items-center transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 rounded-xl overflow-hidden bg-gray-200">
                        <img
                            src="${item.image}"
                            class="w-full h-full object-cover"
                        >
                    </div>
                    <div>
                        <h3 class="font-bold text-lg text-gray-800">
                            ${item.name}
                        </h3>
                        <p class="text-sm text-emerald-600">
                            1 Serving • Recipe
                        </p>
                        <p class="text-xs text-gray-400">
                            ${new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                    </div>
                </div>
                <div class="text-right">
                    <h2 class="text-3xl font-bold text-emerald-600">
                        ${item.calories}
                    </h2>
                    <p class="text-gray-500 text-sm mb-2">
                        kcal
                    </p>
                    <div class="flex gap-2">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            ${item.protein}g P
                        </span>
                        <span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                            ${item.carbs}g C
                        </span>
                        <span class="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">
                            ${item.fat}g F
                        </span>
                        <button
                            class="delete-meal text-red-500 hover:text-red-700"
                            data-index="${index}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
    });
    document.querySelectorAll(".delete-meal").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.currentTarget.dataset.index;
        this.deleteMeal(index);
      });
    });
    document.getElementById("logged-count").textContent =`Logged Items (${foodLog.length})`;
    document.getElementById("totalCalories").textContent =`${calories} / 2000 kcal`;
    document.getElementById("total-protein").textContent = `${protein} / 50 g`;
    document.getElementById("total-carbs").textContent = `${carbs} / 250 g`;
    document.getElementById("total-fat").textContent = `${fat} / 65 g`;
    document.getElementById("calories-progress").style.width =
      `${Math.min((calories / 2000) * 100, 100)}%`;
    document.getElementById("protein-progress").style.width =
      `${Math.min((protein / 50) * 100, 100)}%`;
    document.getElementById("carbs-progress").style.width =
      `${Math.min((carbs / 250) * 100, 100)}%`;
    document.getElementById("fat-progress").style.width =
      `${Math.min((fat / 65) * 100, 100)}%`;

    const clearBtn = document.getElementById("clear-foodlog");
    if (foodLog.length > 0) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }

  deleteMeal(index) {
    let foodLog = JSON.parse(localStorage.getItem("foodLog")) || [];
    foodLog.splice(index, 1);
    localStorage.setItem("foodLog", JSON.stringify(foodLog));
    this.renderFoodLog();
  }

  async searchMeals(query){
        query = query.trim();
        if(query === ""){
            await this.fetchAndDisplayMeals("/meals/search");
            return;
        }
        await this.fetchAndDisplayMeals(`/meals/search?q=${encodeURIComponent(query)}`);
  }

  showFoodLog(){
    document.getElementById("meal-details").classList.add("hidden");
    document.getElementById("all-recipes-section").classList.add("hidden");
    document.getElementById("meal-categories-section").classList.add("hidden");
    document.getElementById("search-filters-section").classList.add("hidden");
    document.getElementById("products-section").classList.add("hidden");
    document.getElementById("foodlog-section").classList.remove("hidden");
    this.renderFoodLog();
    changeHeader("Food Log", "Track your daily nutrition and food intake");
  }

  showProducts(){
    document.getElementById("products-section").classList.remove("hidden");
    document.getElementById("foodlog-section").classList.add("hidden");
    document.getElementById("meal-details").classList.add("hidden");
    document.getElementById("all-recipes-section").classList.add("hidden");
    document.getElementById("meal-categories-section").classList.add("hidden");
    document.getElementById("search-filters-section").classList.add("hidden");
    changeHeader("Product Scanner", "Search packaged foods by name or barcode");
  }

  renderMealDetails(meal) {
    document.querySelector("#meal-details h1").textContent = meal.name;
    document.querySelector("#meal-details img").src = meal.thumbnail;
    document.querySelector("#meal-details img").alt = meal.name;

    // Ingredients
    const ingredients = document.getElementById("ingredients");
    ingredients.innerHTML = "";
    meal.ingredients.forEach((item) => {
      ingredients.innerHTML += `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input
                    type="checkbox"
                    class="w-5 h-5 text-emerald-600">
                <span>
                    <strong>${item.measure}</strong>
                    ${item.ingredient}
                </span>
            </div>
            `;
    });

    // Instructions
    const instructions = document.getElementById("instructions");
    instructions.innerHTML = "";
    meal.instructions.forEach((step, index) => {
      instructions.innerHTML += `
            <div class="flex gap-4 p-4 rounded-xl">

                <div
                    class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    ${index + 1}
                </div>

                <p class="pt-2">
                    ${step}
                </p>

            </div>
            `;
    });

    // Video
    if (meal.youtube) {
      document.querySelector("#meal-details iframe").src = meal.youtube.replace(
        "watch?v=",
        "embed/",
      );
    }
  }

  async fetchMeals(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: {
          "x-api-key": "cFfwEE3PGV0MmSVeoJNajw1qee1Can6UdL6uqeQu",
        },
      });
      const data = await response.json();
      console.log(data);
      if (data.result) return [data.result];
      if (data.results) return data.results;
      if (data.meals) return data.meals;
      if (Array.isArray(data)) return data;
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async fetchAndDisplayMeals(endpoint) {
    const meals = await this.fetchMeals(endpoint);
    const displayMeals = meals.slice(0, 25);
    this.renderMeals(displayMeals);
  }

  renderMeals(meals) {
    this.recipesGrid.innerHTML = "";
    if (meals.length === 0) {
      this.recipesGrid.innerHTML =
        '<p class="text-gray-500">No recipes found.</p>';
      return;
    }
    const displayedMeals = meals.slice(0, 25);
    document.getElementById("recipes-count").textContent =`Showing ${displayedMeals.length} recipes`;
    displayedMeals.forEach((meal) => {
      const mealCard = `
                <div
                class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                data-meal-id="${meal.id}"
                >
                <div class="relative h-48 overflow-hidden">
                    <img
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    src="${meal.thumbnail}"
                    alt="${meal.name}"
                    loading="lazy"
                    />

                    <div class="absolute bottom-3 left-3 flex gap-2">
                    <span
                        class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700"
                    >
                        ${meal.category}
                    </span>

                    <span
                        class="px-2 py-1 bg-emerald-500 text-xs font-semibold rounded-full text-white"
                    >
                        ${meal.area}
                    </span>
                    </div>
                </div>

                <div class="p-4">
                    <h3
                    class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1"
                    >
                    ${meal.name}
                    </h3>

                    <p class="text-xs text-gray-600 mb-3 line-clamp-2">
                    ${meal.instructions.join(" ")}
                    </p>

                    <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold text-gray-900">
                        <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
                        ${meal.category}
                    </span>

                    <span class="font-semibold text-gray-500">
                        <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
                        ${meal.area}
                    </span>
                    </div>
                </div>
                </div>
                `;
      this.recipesGrid.innerHTML += mealCard;
    });
  }

  // Categry
  async fetchCategories() {
    const categories = await this.fetchMeals("/meals/categories");
    this.renderCategories(categories);
  }

  renderCategories(categories) {
    const categoriesGrid = document.getElementById("categories-grid");
    categoriesGrid.innerHTML = "";

    const styles = [
      {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "bg-red-500",
        iconClass: "fa-drumstick-bite",
      },
      {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: "bg-amber-500",
        iconClass: "fa-drumstick-bite",
      },
      {
        bg: "bg-pink-50",
        border: "border-pink-200",
        icon: "bg-pink-500",
        iconClass: "fa-birthday-cake",
      },
      {
        bg: "bg-orange-50",
        border: "border-orange-200",
        icon: "bg-orange-500",
        iconClass: "fa-drumstick-bite",
      },
      {
        bg: "bg-slate-100",
        border: "border-green-200",
        icon: "bg-green-500",
        iconClass: "fa-bowl-rice",
      },
      {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: "bg-lime-500",
        iconClass: "fa-bowl-food",
      },
      {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "bg-red-500",
        iconClass: "fa-bacon",
      },
      {
        bg: "bg-lime-50",
        border: "border-lime-200",
        icon: "bg-yellow-500",
        iconClass: "fa-fish",
      },
      {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "bg-emerald-500",
        iconClass: "fa-bowl-food",
      },
      {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "bg-red-500",
        iconClass: "fa-utensils",
      },
      {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "bg-emerald-500",
        iconClass: "fa-leaf",
      },
      {
        bg: "bg-lime-50",
        border: "border-lime-200",
        icon: "bg-lime-500",
        iconClass: "fa-seedling",
      },
    ];

    categories.slice(0, 12).forEach((category, index) => {
      const style = styles[index % styles.length];
      const categoryCard = `
            <div
                class="category-card ${style.bg} rounded-xl p-3 border ${style.border} hover:shadow-md cursor-pointer transition-all group"
                data-category="${category.name}"
            >
                <div class="flex items-center gap-2.5">
                    <div
                        class="text-white w-9 h-9 ${style.icon} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
                    >
                        <i class="fa-solid ${style.iconClass}"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-gray-900">
                            ${category.name}
                        </h3>
                    </div>
                </div>
            </div>
            `;

      categoriesGrid.innerHTML += categoryCard;
    });
  }

  addCategoryEvents() {
    const categoriesGrid = document.getElementById("categories-grid");

    categoriesGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".category-card");
      if (!card) return;
      const category = card.dataset.category;
      this.filterByCategory(category);
    });
  }

  async filterByCategory(category) {
    await this.fetchAndDisplayMeals(`/meals/filter?category=${category}`);
  }

  // Area
  async fetchAreas() {
    const areas = await this.fetchMeals("/meals/areas");
    this.renderAreas(areas);
  }

  renderAreas(areas) {
    const areasGrid = document.getElementById("areas-grid");
    areasGrid.innerHTML = "";
    areasGrid.innerHTML = `
            <button class="px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap">
                All Recipes
            </button>
        `;
    areas.forEach((area) => {
      areasGrid.innerHTML += `
                <button
                    class="area-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all"
                    data-area="${area.name}">
                    ${area.name}
                </button>
            `;
    });
  }

  addAreaEvents() {
    const areasGrid = document.getElementById("areas-grid");

    areasGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".area-btn");
      if (!btn) return;

      const area = btn.dataset.area;
      this.filterByArea(area);
    });
  }

  async filterByArea(area) {
    await this.fetchAndDisplayMeals(`/meals/filter?area=${area}`);
  }

  async searchProducts(query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/products/search?q=${query}`,
        {
          headers: {
            "x-api-key": "cFfwEE3PGV0MmSVeoJNajw1qee1Can6UdL6uqeQu",
          },
        },
      );
      const data = await response.json();
      this.renderProducts(data.results);
    } catch (err) {
      console.log(err);
    }
  }

  async searchByBarcode(code) {
    try {
      const response = await fetch(`${this.baseUrl}/products/barcode/${code}`, {
        headers: {
          "x-api-key": "cFfwEE3PGV0MmSVeoJNajw1qee1Can6UdL6uqeQu",
        },
      });
      const data = await response.json();
      this.renderProducts([data.result]);
    } catch (err) {
      console.log(err);
    }
  }

  renderProducts(products) {
    const grid = document.getElementById("products-grid");
    grid.innerHTML = "";
    document.getElementById("products-count").textContent =
      `${products.length} products found`;
    products.forEach((product) => {
      grid.innerHTML += `
        <div
            class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
        >
            <div
                class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden"
            >
                <img
                    class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    src="${product.image || "https://placehold.co/300x300"}"
                    alt="${product.name}"
                    loading="lazy"
                />
                <div
                    class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded uppercase"
                >
                    Nutri Score ${product.nutritionGrade?.toUpperCase() || "Unknown"}
                </div>
            </div>
            <div class="p-4">
                <p
                    class="text-xs text-emerald-600 font-semibold mb-1 truncate"
                >
                    ${product.brand || "Unknown Brand"}
                </p>

                <h3
                    class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors"
                >
                    ${product.name}
                </h3>

                <div
                    class="flex items-center gap-3 text-xs text-gray-500 mb-3"
                >
                    <span>
                        <i class="fa-solid fa-barcode mr-1"></i>
                        ${product.barcode}
                    </span>

                    <span>
                        <i class="fa-solid fa-fire mr-1"></i>
                        ${Math.round(product.nutrients.calories)} kcal
                    </span>
                </div>

                <div class="grid grid-cols-4 gap-1 text-center">

                    <div class="bg-emerald-50 rounded p-1.5">
                        <p class="text-xs font-bold text-emerald-700">
                            ${Number(product.nutrients.protein).toFixed(1)}g
                        </p>
                        <p class="text-[10px] text-gray-500">
                            Protein
                        </p>
                    </div>

                    <div class="bg-blue-50 rounded p-1.5">
                        <p class="text-xs font-bold text-blue-700">
                            ${Number(product.nutrients.carbs).toFixed(1)}g
                        </p>
                        <p class="text-[10px] text-gray-500">
                            Carbs
                        </p>
                    </div>

                    <div class="bg-purple-50 rounded p-1.5">
                        <p class="text-xs font-bold text-purple-700">
                            ${Number(product.nutrients.fat).toFixed(1)}g
                        </p>
                        <p class="text-[10px] text-gray-500">
                            Fat
                        </p>
                    </div>

                    <div class="bg-orange-50 rounded p-1.5">
                        <p class="text-xs font-bold text-orange-700">
                            ${Number(product.nutrients.sugar || 0).toFixed(1)}g
                        </p>
                        <p class="text-[10px] text-gray-500">
                            Sugar
                        </p>
                    </div>

                </div>

                <button
                    class="add-product-btn w-full mt-4 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition"
                    data-name="${product.name}"
                    data-calories="${product.nutrients.calories}"
                    data-protein="${product.nutrients.protein}"
                    data-carbs="${product.nutrients.carbs}"
                    data-fat="${product.nutrients.fat}"
                >
                    Add To Food Log
                </button>

            </div>

        </div>
        `;
    });
    this.addProductEvents();
  }

  addProductEvents() {
    document.querySelectorAll(".add-product-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        let foodLog = JSON.parse(localStorage.getItem("foodLog")) || [];
        foodLog.push({
          name: e.target.dataset.name,
          calories: Number(e.target.dataset.calories),
          protein: Number(e.target.dataset.protein),
          carbs: Number(e.target.dataset.carbs),
          fat: Number(e.target.dataset.fat),
          image: "https://placehold.co/100x100",
        });
        localStorage.setItem("foodLog", JSON.stringify(foodLog));
        alert("Product Added");
      });
    });
  }

  setActiveNav(activeId) {
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("bg-emerald-50", "text-emerald-700");
      link.classList.add("text-gray-600");
    });
    const active = document.getElementById(activeId);
    active.classList.remove("text-gray-600");
    active.classList.add("bg-emerald-50", "text-emerald-700");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NutriPlanApp();
});

function changeHeader(title, description) {
  document.getElementById("page-title").textContent = title;
  document.getElementById("page-description").textContent = description;
}

