const express = require("express");
const RecipeBook = require("../models/RecipeBook");
const router = express.Router();

// 5. Get all recipes for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let recipeBook = await RecipeBook.findOne();
    if (!recipeBook) {
      // If no recipes document exists, create one
      recipeBook = new RecipeBook({ userId, recipes: [] });
      await recipeBook.save();
    }

    res.status(200).json(recipeBook);
  } catch (error) {
    res.status(500).json({ error: "Error fetching user recipes", details: error.message });
  }
});

// 2. Add or update a recipe for a user
router.post("/:userId/recipe", async (req, res) => {
  try {
    const { userId } = req.params;
    const recipe = req.body.recipe;

    // Find the user's recipe book
    const recipeBook = await RecipeBook.findOne({ userId });
    if (!recipeBook) {
      return res.status(404).json({ error: "User recipes not found" });
    }

    // Check if the recipe already exists
    const existingRecipe = recipeBook.recipes.id(recipe._id);

    if (existingRecipe) {
      // Update the existing recipe
      Object.assign(existingRecipe, recipe);
    } else {
      // Add a new recipe
      recipeBook.recipes.push({title: recipe.title, categories: recipe.categories, mandatoryIngredients: recipe.mandatoryIngredients, optionalIngredients: recipe.optionalIngredients, description: recipe.description});
    }

    // Save the updated recipe book
    await recipeBook.save();

    res.status(200).json(recipeBook);
  } catch (error) {
    console.error("Error adding or updating recipe:", error);
    res.status(500).json({ error: "Error adding or updating recipe", details: error.message });
  }
});

// 3. Remove a recipe
router.delete("/:userId/recipe/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;

    const recipeBook = await RecipeBook.findOne({ userId });
    if (!recipeBook) return res.status(404).json({ error: "User recipes not found" });

    recipeBook.recipes = recipeBook.recipes.filter(recipe => recipe._id.toString() !== recipeId);
    await recipeBook.save();

    res.status(200).json(recipeBook);
  } catch (error) {
    res.status(500).json({ error: "Error removing recipe", details: error.message });
  }
});

// 4. Update a recipe
router.put("/:userId/recipe/:recipeId", async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    const updatedRecipe = req.body.recipe;

    const recipeBook = await RecipeBook.findOne({ userId });
    if (!recipeBook) return res.status(404).json({ error: "User recipes not found" });

    const recipe = recipeBook.recipes.find(recipe => recipe._id.toString() === recipeId);
    if (!recipe) return res.status(404).json({ error: "Recipe not found" });

    Object.assign(recipe, updatedRecipe);
    await recipeBook.save();

    res.status(200).json(recipeBook);
  } catch (error) {
    res.status(500).json({ error: "Error updating recipe", details: error.message });
  }
});

// 6. Clear all recipes for a user
router.delete("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const recipeBook = await RecipeBook.findOne({ userId });
    if (!recipeBook) return res.status(404).json({ error: "User recipes not found" });

    recipeBook.recipes = []; // Clear all recipes
    await recipeBook.save();

    res.status(200).json(recipeBook);
  } catch (error) {
    res.status(500).json({ error: "Error clearing recipes", details: error.message });
  }
});

// 7. Move specific recipes to another collection (Optional)
router.post("/:userId/move-recipes", async (req, res) => {
  const { userId } = req.params;
  const { recipeIds } = req.body;

  try {
    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return res.status(400).json({ error: "Invalid input. Provide an array of recipeIds." });
    }

    const recipeBook = await RecipeBook.findOne({ userId });
    if (!recipeBook) return res.status(404).json({ error: "User recipes not found" });

    const selectedRecipes = recipeBook.recipes.filter(recipe =>
      recipeIds.includes(recipe._id.toString())
    );

    if (selectedRecipes.length > 0) {
      // Perform operations on the selected recipes (e.g., move them to another collection)
      // Placeholder for additional logic

      // Remove selected recipes from the user's document
      recipeBook.recipes = recipeBook.recipes.filter(recipe =>
        !recipeIds.includes(recipe._id.toString())
      );
      await recipeBook.save();
    }

    res.status(200).json({
      message: "Recipes moved successfully.",
      updatedRecipeBook: recipeBook,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to move recipes.", details: error.message });
  }
});

module.exports = router;
