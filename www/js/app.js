// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'


var app = angular.module('reversi', ['ionic','firebase']);
app.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

app.controller('MainCtrl', function($scope, $firebaseObject) {
  //CREATE A FIREBASE REFERENCE
  var ref = new Firebase("https://torrid-torch-8490.firebaseio.com/game");
  $scope.data = $firebaseObject(ref);
  // this waits for the data to load and then logs the output. Therefore,
  // data from the server will now appear in the logged output. Use this with care!
  $scope.data.$loaded()
    .then(function() {
      $scope.game = new Game($scope.data);
  }).catch(function(err) {
      $scope.message = "Error. Please restart";
  });
  
  $scope.$watch('game', function(updateGame){
    if(updateGame !== undefined) {
      $scope.data.board = updateGame.getJson().board;
      $scope.data.currentMove = updateGame.getJson().currentMove;
      $scope.data.$save();
    }
  }, true);
  
  $scope.newGame = function() {
    $scope.game = new Game();
    
  }
  
  $scope.data.$watch(function() {
    $scope.game = new Game($scope.data);
  });
  
  $scope.addMove = function(x,y) {
    var move = new Move(x,y, $scope.game.nextMove().color);
    
    if(!$scope.game.addMove(move)) {
      $scope.message = "WRONG MOVE";
    } else {
      $scope.message = "";
    }
  }
  
});


function Player(name, color) {
  this.name = name;
  this.color = color;
}

function Move(x,y, color) {
  this.x = x;
  this.y = y;
  this.color = color;
  
  this.equals = function(move) {
    return this.x == move.x && this.y == move.y && this.color == move.color;
  }
  
}
function Game(anotherGame) {
  var BLACK = 1;          // Declare state of each square
  var WHITE = 2;
  var EMPTY = 0;
  var WIDTH = 10;
  var HEIGHT = 10;
  var OFFBOARD = -1;
  var board;
  var currentMove; 
  function initGame() {
    if(anotherGame !== undefined) {
      board = anotherGame.board;
      currentMove = new Move(anotherGame.currentMove.x, anotherGame.currentMove.y, anotherGame.currentMove.color);
      return;
    }
    
    var x = new Array(WIDTH);
    for (var i = 0; i < HEIGHT; i++) {
      x[i] = new Array(WIDTH);
    }
    board = x;
     // Initialize off-board squares
    for (var i=0; i<WIDTH; i++) {     
        board[i][0] = OFFBOARD;
        board[i][WIDTH-1] = OFFBOARD;
        board[0][i] = OFFBOARD;
        board[HEIGHT-1][i] = OFFBOARD;
    }

    // Initialize game board to be empty except for initial setup
    for (var i=1; i<HEIGHT-1; i++)        
        for (var j=1; j<WIDTH-1; j++)
	         board[i][j] = EMPTY;
    
    board[HEIGHT/2-1][WIDTH/2-1] = WHITE;        
    board[HEIGHT/2][WIDTH/2-1] = BLACK;
    board[HEIGHT/2-1][WIDTH/2] = BLACK;
    board[HEIGHT/2][WIDTH/2] = WHITE;
    currentMove = new Move(HEIGHT/2-1, WIDTH/2-1, WHITE);
  }
  
  initGame();
  this.board = board;
  this.currentMove = currentMove;
  
  this.getJson = function() {
    var szJsonRecord = JSON.stringify(this);
    var jsonRecord = JSON.parse(szJsonRecord);
    return jsonRecord;
  }
  
  this.nextMove = function() {
    if(currentMove.color == BLACK) {
      return new Move(-1,-1, WHITE);
    } else {
      return new Move(-1,-1, BLACK);
    }
  }
  
  
  
  this.addMove = function(move) {
    if(this.legalMove(move, true)) {
      currentMove.x = move.x;
      currentMove.y = move.y;
      currentMove.color = move.color;
      return true;
    } else {
      return false;
    }
  }
  
  this.legalMove = function(move, flip) {
    var legal = false;
    
    if(this.isEmptyBoard(move)) {
      // Initialize variables
			var posX;
			var posY;
			var found;
			var current;
			
			// Searches in each direction
			// x and y describe a given direction in 9 directions
			// 0, 0 is redundant and will break in the first check
			for (var x = -1; x <= 1; x++){
				for (var y = -1; y <= 1; y++)
				{
					// Variables to keep track of where the algorithm is and
					// whether it has found a valid move
					posX = move.x + x;
					posY = move.y + y;
					found = false;
					current = board[posY][posX];
					
					// Check the first cell in the direction specified by x and y
					// If the cell is empty, out of bounds or contains the same color
					// skip the rest of the algorithm to begin checking another direction
					if (current === -1 || current === 0 || current == move.color)
					{
						continue;
					}
					
					// Otherwise, check along that direction
					while (!found)
					{
						posX += x;
						posY += y;
						current = board[posY][posX];
						
						// If the algorithm finds another piece of the same color along a direction
						// end the loop to check a new direction, and set legal to true
						if (current == move.color)
						{
							found = true;
							legal = true;
							
							// If flip is true, reverse the directions and start flipping until 
							// the algorithm reaches the original location
							if (flip)
							{
								posX -= x;
								posY -= y;
								current = board[posY][posX];
								
								while(current !== 0)
								{
									board[posY][posX] = move.color;
									posX -= x;
									posY -= y;
									current = board[posY][posX];
								}
							}
						}
						// If the algorithm reaches an out of bounds area or an empty space
						// end the loop to check a new direction, but do not set legal to true yet
						else if (current === -1 || current === 0)
						{
							found = true;
						}
					}
				}
			}
    }
    if(legal && flip) {
      board[move.y][move.x] = move.color;
    }
    return legal;
  }
  
  this.isEmptyBoard = function(move) {
    return board[move.y][move.x] === EMPTY;
  }
  
  this.currentResult = function() {
    var result = {
      black: 0,
      white: 0,
      winner : function() {
        if(this.black > this.white) {
          return 'BLACK';
        } else if(this.white > this.black) {
          return 'WHITE';
        } else if(this.white == this.black) {
          return 'TIE';
        }
      }
    }
    for (var i=1; i<HEIGHT-1; i++)        {
        for (var j=1; j<WIDTH-1; j++) {
          if(board[i][j] == BLACK) {
            result.black ++;
          } else if(board[i][j] == WHITE) {
            result.white ++;
          }
        }
    }
    return result;
  }
  
}


