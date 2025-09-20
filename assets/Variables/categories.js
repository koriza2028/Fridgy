export const tags = [
    {tagName: 'Under 15m', tagIcon: '🕐', tagType: 1},
    {tagName: 'Under 30m', tagIcon: '🕑', tagType: 1},
    {tagName: 'Under 1h', tagIcon: '🕒', tagType: 1},
    // {tagName: 'Breakfast', tagIcon: '🥞', tagType: 2},
    // {tagName: 'Lunch', tagIcon: '🍲', tagType: 2},
    // {tagName: 'Diner', tagIcon: '🍛', tagType: 2},
    {tagName: 'Chicken', tagIcon: '🍗', tagType: 3},
    {tagName: 'Beef', tagIcon: '🥩', tagType: 3},
    {tagName: 'Pork', tagIcon: '🍖', tagType: 3},
    {tagName: 'Fish', tagIcon: '🍣', tagType: 3},
    {tagName: 'Vegan', tagIcon: '🥦', tagType: 3},
    // {tagName: 'Salad', tagIcon: '🥗', tagType: 4},
    // {tagName: 'Soup', tagIcon: '🍜', tagType: 4},
    // {tagName: 'Dessert', tagIcon: '🍰', tagType: 4},
    {tagName: 'Pan', tagIcon: '🍳', tagType: 5},
    {tagName: 'Pot', tagIcon: '🥘', tagType: 5},
    {tagName: 'Oven', tagIcon: '♨️', tagType: 5},
];



export const categories = [
  { tagNameKey: 'Fridge.categoryList.Basics', tagIcon: '🥚', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Fruit', tagIcon: '🍌', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Vegetable', tagIcon: '🥕', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Juice', tagIcon: '🧃', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Milk product', tagIcon: '🥛', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Yogurt', tagIcon: '🍶', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Cream', tagIcon: '🧈', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Cheese', tagIcon: '🧀', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Meat products', tagIcon: '🥓', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Meat', tagIcon: '🥩', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Fish', tagIcon: '🍣', tagType: 1 },
  { tagNameKey: 'Fridge.categoryList.Frozen food', tagIcon: '❄️', tagType: 1 }
];


export const categoryNames = categories.map(c => c.tagNameKey);

