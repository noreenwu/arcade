/*
 *  Noreen Wu
 *  Udacity Front-End Developer Assignment 3
 *  March 31, 2019
 */

/*  Most of this file was provided as part of the code base, but a lot
 *  of changes were filled in in the function checkCollisions().
 */

/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine makes the canvas' context (ctx) object globally available to make
 * writing app.js a little simpler to work with.
 */

var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas element's height/width and add it to the DOM.
     */
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime;

    canvas.width = 505;
    canvas.height = 606;
    doc.body.appendChild(canvas);

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */
        update(dt);
        render();

        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    }

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        reset();
        lastTime = Date.now();
        main();
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {
        if (playing) {
          updateEntities(dt);
          checkCollisions();
        }
    }

    /*  This function contains the logic which determines whether the player
     *  is still in the game, whether s/he has earned a Gem or Health,
     *  bumped into an enemy bug and lost the game, or reached the safety
     *  of the water and won the game. It is all based on the rectangular
     *  coordinates of each graphic in the 2D space and whether overlaps
     *  have occurred.
    */
    function checkCollisions() {

        const waterRect = {   // the size and coordinates of the rectangle
            x: 0,             // representing the water does not change
            y: 0,
            width: 905,
            height: 111 };


        pRect = player.getRect(pRect);   // get player rectangular coordinates

        // Has the player won?
        // We compare the rectangle that is occupied by the water graphic
        // with the rectangle occupied by the player, to determine whether
        // the player has won.
        if (detectObjectOverlap(waterRect, pRect)) {
           showWinner();
        }

        // Has the player lost?
        // All of the enemies are instantiated at the start of the game
        // and placed in the global array, allEnemies. Now to determine
        // whether the player has lost, we loop through all the enemies
        // and figure out whether each enemy overlaps with the player's
        // rectangle.
        allEnemies.forEach(function(enemy) {

            enRect = enemy.getRect(enRect);

            // if a collision with a bug (enemy) is detected then unless the player
            // has extra health from intersecting with the heart, then the game ends.
            if (detectObjectOverlap(enRect, pRect) && !player.isExtraHealthy() ) {
              tryAgain();
            }
        });

        // Has the player intersected with a Heart? If so, the player token
        // changes to the Cat Girl and the enemy bugs become ghost-like.
        hhRect = heartHealth.getRect(hhRect);

        if ( (detectObjectOverlap(hhRect, pRect)) && heartHealth.visible() ) {
            player.gotHealth();
            heartHealth.setCollected();
            m.messageUser("YOU GOT HEALTH!");

            // enemies are harmless, and look ghost-like, until health times out
            allEnemies.forEach(function(enemy) {
                enemy.harmlessSprite();
            });
        }

        // Has the player intersected with a Gem? We aren't keeping score in this game,
        // but the user will see a message that s/he has earned a Gem.
        gemRect = collectibleGem1.getRect(gemRect);

        if ( (detectObjectOverlap(gemRect, pRect)) && collectibleGem1.visible() ) {
           m.messageUser("YOU GOT A GEM!");
           collectibleGem1.setCollected();
        }
    }

    // This is the function that determines whether or not 2 rectangles overlap.
    // The rectangle representing each graphic in the pair that needs to be compared
    // are sent to this function and true (intersection found) or false (no intersection)
    // is returned.
    function detectObjectOverlap(rect1, rect2) {
      if (rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y) {
            return true;
      }
      return false;
    }

    /* This is called by the update function and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        player.update();
    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */
    function render() {
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
        var rowImages = [
                'images/water-block.png',   // Top row is water
                'images/stone-block.png',   // Row 1 of 3 of stone
                'images/stone-block.png',   // Row 2 of 3 of stone
                'images/stone-block.png',   // Row 3 of 3 of stone
                'images/grass-block.png',   // Row 1 of 2 of grass
                'images/grass-block.png'    // Row 2 of 2 of grass
            ],
            numRows = 6,
            numCols = 5,
            row, col;

        // Before drawing, clear existing canvas
        ctx.clearRect(0,0,canvas.width,canvas.height);

        /* Loop through the number of rows and columns we've defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                ctx.drawImage(Resources.get(rowImages[row]), col * 101, row * 83);
            }
        }

        renderEntities();
    }

    /* This function is called by the render function and is called on each game
     * tick. Its purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        /* Loop through all of the objects within the allEnemies array and call
         * the render function you have defined.
         */
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });

        player.render();
        heartHealth.render();
        collectibleGem1.render();
    }

    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
        // noop
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/char-cat-girl-trimmed.png',
        'images/enemy-bug-trimmed.png',
        'images/char-boy-trimmed.png',
        'images/char-boy-trimmed-red-background.png',
        'images/blue-gem-trimmed.png',
        'images/heart-trimmed.png',
        'images/ghost-bug.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developers can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
})(this);
