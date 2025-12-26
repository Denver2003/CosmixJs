#ifndef Boltrix_GameScene_h
#define Boltrix_GameScene_h
#include "cocos2d.h"
#include "Box2D.h"
#include "LevelHelperLoader.h"
#include "LevelLoader.h"
#include "Alien.h"
#include "Laser.h"
#include "InfoLabel.h"
#include "cameraPoint.h"
#include "button.h"
#include "popupMenu.h"


/// rezhim of falling figure
#define STATE_FIGURE_CREATE     0
#define STATE_FIGURE_FALL       1
#define STATE_FIGURE_CONTROL    2

#define COMBO_TIME              4

#define TAG_END_OF_LEVEL		999

#define POINTS_COLOR ccc3(255,0,0)
#define POINTS_FONT "Airmole Antique.ttf"
//#define POINTS_FONT_SIZE 20

#define FLOAT_POINTS_COLOR ccc3(255,255,255)
#define FLOAT_POINTS_COLOR1 ccc3(100,200,255)
#define FLOAT_POINTS_COLOR2 ccc3(100,255,100)
#define FLOAT_POINTS_COLOR3 ccc3(255,100,100)

#define COMBO_COLOR2 ccc3(100,200,255)
#define COMBO_COLOR3 ccc3(100,200,255)
#define COMBO_COLOR4 ccc3(100,255,100)
#define COMBO_COLOR5 ccc3(255,255,100)
#define COMBO_COLOR6 ccc3(255,100,100)

#define COIN_MIN  5
#define COIN_MAX  10

#define GAMESTATE_MAINMENU      0
#define GAMESTATE_PAUSEMENU     1
#define GAMESTATE_PLAY          2
#define GAMESTATE_GAMEOVERMENU  3
#define GAMESTATE_SHOP          4
#define GAMESTATE_STATISTIC     5

#define TUTORIAL_NEED_TO_SHOW   0
#define TUTORIAL_SHOWING        1
#define TUTORIAL_NEED_TO_CLOSE  2
#define TUTORIAL_CLOSED         3



#define FLOAT_POINTS_FONT "Airmole Antique.ttf"
//#define FLOAT_POINTS_FONT_SIZE 28

class GameScene : public cocos2d::CCLayer {
public:
	GameScene();
	~GameScene(void);

	static cocos2d::CCScene* scene();

    void tick(float dt);
    void tick10(float dt);
    void tick60(float dt);
    

    
    static GameScene * gameScene;
/// functions
	    // init
    void retrieveRequiredObjects(void);
    void setupCollisionHandling();
    void setupAudio();
    bool setupScore();
    bool setupLevelLabel();
	void clearTemplatesFromLevel();
	void initFirst();
    void initNewGame();
    void destroyGameData();
    void initLevelHelperOnce();

	

	void scoreUpdate(); // draw score label update

    void coinsUpdate(); // draw score label update
    void coinsGetIt(CCPoint point,int count=0); // draw score label update
    void coinsFly(CCPoint point, int coinsCount);
    
    
	void levelLabelUpdate(); // draw level label update
    void levelStatusUpdate();
    void levelStatusBlink();
	
	void scoreFlyCreate(CCPoint point, int localScore, float delay = 0,ccColor3B color = ccc3(255,255,255), int figureColor = 0 );	// create fly score label
    void scoreFlyRemove(CCNode * node);					// remove fly score label
    
	void loadRespawnPoints(); // load respawn points from level
    void loadBubblesStartPoints();

	void stageInitCollisionInit();	// init collision
	void stageClearCollision();		// clear collision
	
	// figures
	void figureTypeCollision(CCObject * object); // update collision of figures
	void figureCreateNew();
	void figureEndOfPath(CCNode * node);
	void changeColorNextFigure(CCNode * node, void * data);
	void figureMakeDynamic(bool needCreateNew = true);
	void changePositionNextFigure(CCNode * node);
	//void figureCollideWithEOL(LHSprite * sprite);
	//void figureUncollideWithEOL(LHSprite * sprite);
    
    
    
  	
	//void figureEndOfLevelCollision(cocos2d::CCObject *object);

	void fallStatusStart();
    void fallStatusEnd();
    void fallStatusUpdate(float percent);


	int checkCombo(CCPoint pos);

	void scoreHitAtPosition(CCPoint position, int points,float delay = 0.0, int figureColor = 0);
    void scoreHit(int points);
	void removeScoreText(CCNode * node);



	// game state and menu
	virtual void restartGame(); 
	void gameOver();
    void gameOverAnimHasEnded(CCObject * object);


	void createMouseJoint(b2Vec2 locationWorld);

	//control
    virtual void ccTouchesEnded	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesBegan	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesCancelled(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesMoved	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);

	CCRect boundBoxFromSprite(LHSprite * sprite);

    void preNewStage();
    void afterNewStage();

	/// for falling bonus
	
	void fallRandomFigures();
	void fallFiguresAfterNewStage();
    
    void fallOfFigureEnd(CCNode * node);

    bool isPlayingNow();
    
    void startMainMenu();
    void startPlay();
    void setPause();
    void resumePlay();
    
   void endOfPrevGame();
    
    /// buttons
    void buttonPlayAction(CCObject * object);
    void buttonShopAction(CCObject * object);
    void buttonPauseAction(CCObject * object);
    void buttonResumeAction(CCObject * object);
    void buttonResume2Action(CCObject * object);
    void buttonRestartActionWithRating(CCObject * object);

    void buttonRestartAction(CCObject * object);
    
    void buttonChangeSound(CCObject * object);
    void buttonChangeMusic(CCObject * object);

    void onShowPauseMenu(CCObject * object);
    void onShowGameoverMenu(CCObject * object);
    void onShowTaskMenu(CCObject * object);
    void onShowRatingMenu(CCObject * object);
    void onShowShop(CCObject * object);
    
    
    void onShowTutorial1(CCObject * object);
    void onShowTutorial2(CCObject * object);
    void onShowTutorial3(CCObject * object);
    void onShowTutorial4(CCObject * object);
    
    

    string intToNormalStr(int value);
    

    Button *            playButton;
    Button *            shopButton;
    Button *            pauseButton;
    
    Button *            buttonResume;
    Button *            buttonReply;

    Button *            buttonSound;
    Button *            buttonMusic;
    
    Button *            buttonShop;
    

    Button *            buttonReply2;
    Button *            buttonShop2;
    

    Button *            buttonResume2;
    
    Button *            nextRatingButton;
    
    
    PopupMenu * pauseMenu;
    PopupMenu * gameoverMenu;
    PopupMenu * tasksMenu;
    PopupMenu * ratingMenu;
    
    PopupMenu * tutorial1;
    PopupMenu * tutorial2;
    PopupMenu * tutorial3;
    PopupMenu * tutorial4;


    int     tutorialCount;
    int     tutorialStep;
    bool    hideTutorial;
    bool    tutorialStepDone;
    bool    tutorialStepDoneResrved;
    float   timeToNextTutorial;
    
    bool isTutorial(int tutorial);
	/*
	void updateScorePosition();
    */
    

    void pauseChildren(CCNode * node);
    void resumeChildren(CCNode * node);
	//control
	  /* 
    
    void touchBeginOnSprite(CCObject* cinfo);
    void touchMovedOnSprite(CCObject* cinfo);
    void touchEndedOnSprite(CCObject* cinfo);    


	// DEBUG DRAW

	void draw( void );
	*/
    

public:
	map<LHSprite *, LHSprite *> topSprites;

    
    bool isHiScore;
    bool isHiLevel;
    bool isHiCoins;
    bool isHiFigureCleared;
    //  состояние игры
    // 0 - главное меню
    // 1 - игра
    // 2 пауза
    // 3 магазин
    int gameState;

    CameraPoint * camPntPlay;
    CameraPoint * camPntMainMenu;
    //CameraPoint * camPntPlay;
    
    
    //CCLayer *            levelLayer;
	CCLayer *            topLayer;
    
    b2World*            world;
    LevelHelperLoader * loader;

  	LevelPack *			levelPack;
	Level *				level;
	Quest *				quest;
    

	CCSize				winSize;

	Alien *				currentAlien; 
	
	Alien *				fallingAlien; 
	

  	Alien *				backingAlien; 
   	Alien *				prevBackingAlien; 
    
    LHSprite *          fallStatus;

    LHSprite *          buttonPause;
    
    LHSprite *          levelStatus;
    
    LHSprite *          aimLeft;
    LHSprite *          aimRight;
    
    LHSprite *          moon;
    LHSprite *          gameOverSprite;
    

    
    
    
    float               prevVelocityY;
    
    int     stateFigure;
    float   curTickCount;
    
    
    

    //fast fall
    bool        fastFallDown;
    float       fastFallDownMaxTime;
    float       fastFallDownCounter;
    CCTouch *   touchFastFallDown;

    //control
    CCPoint     prevMovePosition;
	float       spriteRotation;
    CCTouch *   touchMoveRotate;  
    // game over
	CCRect      rectGameOver;
    bool        isGameOver;

	Laser *		laser;
    
    Figure *    nextFigure;

	bool isInitialed;
	/// joints for move
    b2MouseJoint *		mouseJoint;
	b2PrismaticJoint *	prismaticJoint;
	
    
	
	map<LHSprite *,int> gameOverCollisions;
	
    InfoLabel * infoScore;
    InfoLabel * infoLevel;
    InfoLabel * infoCoins;
    
    
    
	int				score;
	int				figureCleared;
	int				coins; // coins in current level

    int             coinAddBonus;
    int             coinMultBonus;
    
    
    //LHSprite *      scoreSprites[8]; 
    //LHSprite *      levelSprites[3]; 

	vector<CCPoint> respawnPoints;
	/// falling count rocket
	int fallingCount;
    
    
    int fontSizeScore;
    int fontSizeFloatScore;
    
    
	Alien * nextFigureAlien;
    float nextFigureXPosition;

    ///combo
    int     comboCount;
    float   comboTime;
    /// 
	float	stepOfShock;
	float	stepOfFallingFigure;

    CCPoint     figureStartPoint;
    CCPoint     figureEndPoint;
    
    CCPoint     comboPoint;
    CCPoint     nextLevelPoint;
    CCPoint     levelAchivePoint;
    CCPoint     additionalPoint;
    
    
    float       ciferFlyDistance;
    float       ciferFlyWidth;
    
    int			multiplier;
    LHBatch *	typesBatch;

	LHBatch *	ciferFlyBatch;
	
};
#endif