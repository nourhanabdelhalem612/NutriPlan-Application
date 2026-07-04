class Navigation {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = {
            'Meals & Recipes': document.getElementById('meals-section'),
            'Product Scanner': document.getElementById('products-section'),
            'Food Log': document.getElementById('foodlog-section')
        };
        
        this.init();
    }

    init() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.setActive(link);
            });
        });
    }

    setActive(activeLink) {
        // 1. تحديث شكل الروابط (CSS classes)
        this.navLinks.forEach(link => {
            link.classList.remove('bg-emerald-50', 'text-emerald-700');
            link.classList.add('text-gray-600');
            link.querySelector('span').classList.replace('font-semibold', 'font-medium');
        });
        
        activeLink.classList.add('bg-emerald-50', 'text-emerald-700');
        activeLink.classList.replace('text-gray-600', 'text-emerald-700');
        activeLink.querySelector('span').classList.replace('font-medium', 'font-semibold');

        // 2. إخفاء وإظهار الأقسام
        const sectionName = activeLink.querySelector('span').innerText;
        Object.values(this.sections).forEach(sec => sec?.classList.add('hidden'));
        if (this.sections[sectionName]) {
            this.sections[sectionName].classList.remove('hidden');
        }
    }
}


class NutriPlanApp{
    constructor(){
        this.recipesGrid = document.getElementById('recipesGrid');
        this.baseUrl = 'https://nutriplan-api.vercel.app/api'; 
        this.init();
    }

    async init(){
        await this.fetchAndDisplayMeals('/meals/search?name='); 
        await this.fetchCategories();
        await this.fetchAreas();
        this.addCategoryEvents();
        this.addAreaEvents();
        this.addMealEvents();

    }
    
    addMealEvents(){
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
        this.renderMealDetails(meal);
    }

    renderMealDetails(meal){
        document.querySelector("#meal-details h1").textContent= meal.name;
        document.querySelector("#meal-details img").src= meal.thumbnail;
        document.querySelector("#meal-details img").alt= meal.name;

        // Ingredients
        const ingredients= document.getElementById("ingredients");
        ingredients.innerHTML= "";
        meal.ingredients.forEach(item => {
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
        const instructions= document.getElementById("instructions");
        instructions.innerHTML= "";
        meal.instructions.forEach((step,index)=>{

            instructions.innerHTML += `
            <div class="flex gap-4 p-4 rounded-xl">

                <div
                    class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    ${index+1}
                </div>

                <p class="pt-2">
                    ${step}
                </p>

            </div>
            `;

        });

        // Video
        if(meal.youtube){
            document.querySelector("#meal-details iframe").src =
            meal.youtube.replace("watch?v=","embed/");
        }

    }

    async fetchMeals(endpoint){
        try{
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: "GET",
                headers:{
                    "x-api-key": "cFfwEE3PGV0MmSVeoJNajw1qee1Can6UdL6uqeQu"
                }
            });
            const data = await response.json();
            console.log(data);
            if(data.result) return [data.result];   
            if(data.results) return data.results;
            if(data.meals) return data.meals;
            if(Array.isArray(data)) return data;
            return [];
        }catch(error){
            console.error(error);
            return [];
        }
    }

    async fetchAndDisplayMeals(endpoint){
        const meals= await this.fetchMeals(endpoint);
        const displayMeals= meals.slice(0, 25);
        this.renderMeals(displayMeals);
    }

    renderMeals(meals){
        this.recipesGrid.innerHTML = '';
        if (meals.length === 0){
            this.recipesGrid.innerHTML='<p class="text-gray-500">No recipes found.</p>';
            return;
        }
        meals.forEach(meal => {
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
            this.recipesGrid.innerHTML+= mealCard;
        });
    }

    // Categry
    async fetchCategories(){
    const categories = await this.fetchMeals('/meals/categories');
    this.renderCategories(categories);
    }   

    renderCategories(categories){
    const categoriesGrid = document.getElementById("categories-grid");
    categoriesGrid.innerHTML = "";

        const colors = [
        "from-red-50 to-pink-50 border-red-200 from-red-400 to-red-500",
        "from-orange-50 to-amber-50 border-orange-200 from-orange-400 to-orange-500",
        "from-pink-50 to-rose-50 border-pink-200 from-pink-400 to-pink-500",
        "from-yellow-50 to-orange-50 border-yellow-200 from-yellow-400 to-yellow-500",
        "from-blue-50 to-cyan-50 border-blue-200 from-blue-400 to-blue-500",
        "from-green-50 to-emerald-50 border-green-200 from-green-400 to-green-500",
        "from-cyan-50 to-teal-50 border-cyan-200 from-cyan-400 to-cyan-500",
        "from-gray-50 to-slate-50 border-gray-200 from-gray-400 to-gray-500",
        "from-lime-50 to-green-50 border-lime-200 from-lime-400 to-lime-500",
        "from-violet-50 to-purple-50 border-violet-200 from-violet-400 to-violet-500",
        "from-indigo-50 to-blue-50 border-indigo-200 from-indigo-400 to-indigo-500",
        "from-teal-50 to-cyan-50 border-teal-200 from-teal-400 to-teal-500"
    ];

    categories.slice(0, 12).forEach((category, index) => {
        const categoryCard = `
            <div
                class="category-card bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
                data-category="${category.name}"
            >
                <div class="flex items-center gap-2.5">
                    <div
                        class="text-white w-9 h-9 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm"
                    >
                        <i class="fa-solid fa-drumstick-bite"></i>
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
    
    async filterByCategory(category){
        await this.fetchAndDisplayMeals(`/meals/filter?category=${category}`);
    }

    // Area
    async fetchAreas(){
        const areas = await this.fetchMeals('/meals/areas');
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
        areas.forEach(area => {
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

    


}

document.addEventListener('DOMContentLoaded', () => {
    new NutriPlanApp();
});




// class ProductSearch {
//     constructor() {
//         this.baseUrl = 'https://nutriplan-api.vercel.app/api';
//         this.productsGrid = document.getElementById('products-grid');
//         this.searchInput = document.getElementById('product-search-input');
//         this.searchBtn = document.getElementById('search-product-btn');
//         this.barcodeInput = document.getElementById('barcode-input');
//         this.lookupBtn = document.getElementById('lookup-barcode-btn');
        
//         this.initEvents();
//     }

//     initEvents() {
//         this.searchBtn.addEventListener('click', () => this.searchProduct(this.searchInput.value));
//         this.lookupBtn.addEventListener('click', () => this.lookupBarcode(this.barcodeInput.value));
//     }


//     async searchProduct(query) {
//         if (!query) return;
//         try {
//             const response = await fetch(`${this.baseUrl}/products/search?name=${query}`);
//             const data = await response.json();
//             this.renderProducts(data.products || []); // تأكدي من هيكل البيانات المرجعة
//         } catch (error) {
//             console.error("Error searching products:", error);
//         }
//     }

//     // البحث بالباركود باستخدام الـ API الخاص بك
//     async lookupBarcode(code) {
//         if (!code) return;
//         try {
//             const response = await fetch(`${this.baseUrl}/products/barcode/${code}`);
//             const data = await response.json();
//             // بما أن الباركود يرجع منتج واحد غالباً، نحوله لمصفوفة لنمررها لدالة العرض
//             this.renderProducts(data ? [data] : []);
//         } catch (error) {
//             console.error("Error looking up barcode:", error);
//         }
//     }

//     renderProducts(products) {
//     this.productsGrid.innerHTML = ""; // تفريغ الـ Grid
    
//     if (!products || products.length === 0) {
//         this.productsGrid.innerHTML = `<p class="col-span-full text-center py-10 text-gray-500">No products found.</p>`;
//         return;
//     }

//     products.forEach(product => {
//         // إنشاء الكارد لكل منتج
//         const card = document.createElement('div');
//         card.className = "product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group";
//         card.setAttribute('data-barcode', product.barcode || '');

//         card.innerHTML = `
//             <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
//                 <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
//                      src="${product.image_url || 'placeholder.jpg'}" alt="${product.name}" loading="lazy" />
                
//                 <div class="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
//                     Nutri-Score ${product.nutri_score?.toUpperCase() || 'N/A'}
//                 </div>
//                 <div class="absolute top-2 right-2 bg-lime-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center" 
//                      title="NOVA ${product.nova_group || ''}">
//                     ${product.nova_group || '-'}
//                 </div>
//             </div>
//             <div class="p-4">
//                 <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${product.brand || 'Unknown'}</p>
//                 <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
//                     ${product.name}
//                 </h3>
//                 <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
//                     <span><i class="fa-solid fa-weight-scale mr-1"></i>${product.serving_size || 'N/A'}</span>
//                     <span><i class="fa-solid fa-fire mr-1"></i>${product.calories || 0} kcal</span>
//                 </div>
//                 <div class="grid grid-cols-4 gap-1 text-center">
//                     ${this.renderMiniNutrition(product.nutriments)}
//                 </div>
//             </div>
//         `;
        
//         this.productsGrid.appendChild(card);
//     });
// }

// // دالة مساعدة لتنسيق قيم الـ Nutriments
// renderMiniNutrition(nutriments = {}) {
//     return `
//         <div class="bg-emerald-50 rounded p-1.5">
//             <p class="text-xs font-bold text-emerald-700">${nutriments.proteins || 0}g</p>
//             <p class="text-[10px] text-gray-500">Protein</p>
//         </div>
//         <div class="bg-blue-50 rounded p-1.5">
//             <p class="text-xs font-bold text-blue-700">${nutriments.carbs || 0}g</p>
//             <p class="text-[10px] text-gray-500">Carbs</p>
//         </div>
//         <div class="bg-purple-50 rounded p-1.5">
//             <p class="text-xs font-bold text-purple-700">${nutriments.fat || 0}g</p>
//             <p class="text-[10px] text-gray-500">Fat</p>
//         </div>
//         <div class="bg-orange-50 rounded p-1.5">
//             <p class="text-xs font-bold text-orange-700">${nutriments.sugars || 0}g</p>
//             <p class="text-[10px] text-gray-500">Sugar</p>
//         </div>
//     `;
// }
// }


// class MealDetails{
//     constructor(){
//         this.baseUrl= "https://nutriplan-api.vercel.app/api";
//         this.detailsContainer = document.getElementById("meal-details");
//         this.init();
//     }

//     async init(){
//         const params= new URLSearchParams(window.location.search);
//         const id= params.get("id");
//         if(id){
//             await this.fetchMeal(id);
//         }
//     }

//     async fetchMeal(id){
//         const response = await fetch(`${this.baseUrl}/meals/${id}`,{
//             headers:{
//                 "x-api-key":"cFfwEE3PGV0MmSVeoJNajw1qee1Can6UdL6uqeQu"
//             }
//         });
//         const data = await response.json();
//         this.renderMealDetails(data.result);
//     }

// }

