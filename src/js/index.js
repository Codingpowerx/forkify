
import Search from "./modals/Search";
import Recipe from "./modals/recipe";
import List from "./modals/list";
import Likes from "./modals/likes";
import { elements, renderLoader, clearLoader } from "./views/base";
import * as searchView from './views/SearchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';


/**** GLOBAL STATE OF THE APP
 * - search object
 * - current object
 * - shopping list
 * - liked recipes
 */

const state = {};



/////// SEARCH CONTROLLER

const controlSearch = async () => {

    //get query from the view
    const query = searchView.getInput();
    

    if (query){
        // new search object and add to state
        state.search = new Search(query);


        // prepare UI for results
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);

        try{
            //search for recipes
            await state.search.getResults();

            //render results on UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (err) {
            alert ('Something went wrong with the search controller.....');
            clearLoader();
        }

    }
};

elements.searchForm.addEventListener('submit', ent => {
    ent.preventDefault();
    controlSearch();
});


elements.searchResPages.addEventListener('click', okna => {
    const btn = okna.target.closest('.btn-inline')
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
        
    }
});







//// RECIPE CONTROLLER

const controlRecipe = async () => {

    // get id from url
    const id = window.location.hash.replace('#', '');

    if(id) {
        // prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //highlight selected search item
        if(state.search)searchView.highlightedSelected(id);

        // create the new recipe object
        state.recipe = new Recipe(id);


        try {
            //get recipe data and parse ingredient
            await state.recipe.getRecipe();
            state.recipe.parseIngredients(); 

            //calculate servings and time
            state.recipe.calcTime();
            state.recipe.calcServings();

            //render recipe
            clearLoader();
            recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
        } catch (err) {
            alert('Error processing recipe')    
        }
        
    }

}

//window.addEventListener('hashchange', controlRecipe);
//window.addEventListener('load', controlRecipe);

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));




//// LIST CONTROLLER

const controlList = () => {
    //clear any list that was there before now
    listView.clearList();

    //create a new list if there is none yet
    if(!state.list) state.list = new List();

    //Add each ingredient to the list and UI

    state.recipe.ingredients.forEach(el => {
        const item =   state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);


    });
};



/// Handle , delete and update list item events
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // handle the delte button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //delete item from state
        state.list.deleteItem(id);

        //delete item from state
        listView.deleteItem(id);


        //handle the count update!!
    } else if(e.target.matches('.shopping__count-value') > 1) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    };
});




///// LIKES CONTROLLER



 
const controlLike = () => {
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    // USER HAS NOT YET LIKED CURRENT RECIPE
    if(!state.likes.isLiked(currentID)) {
        // add like to state
        const newLike = state.likes.addLike(currentID, state.recipe.title, state.recipe.author, state.recipe.img);
        //toggle the like button
        likesView.toggleLikeBtn(true);
        //add like to the UI list
        likesView.renderLike(newLike);
    // USER HAS LIKED THE CURRENT RECIPE    
    } else {

        // remove like from  state
        state.likes.deleteLike(currentID);

        //toggle the like button
        likesView.toggleLikeBtn(false);

        //remove like from UI list
        likesView.deleteLike(currentID);
    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
};



//// Restore liked recipes on page reloads

window.addEventListener('load', () => {
    //empty array of likes
    state.likes = new Likes();
    //restorre likes
    state.likes.readStorage();
    //toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes());
    //render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
});




//Handling recipe button clicks

elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //decrease button is clicked
        if(state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }

    } else if(e.target.matches('.btn-increase, .btn-increase *')){
        //increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {

        //ADD INGREDIENTS TO SHOPPING LIST
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        // like controller 

        controlLike();
    }
});

