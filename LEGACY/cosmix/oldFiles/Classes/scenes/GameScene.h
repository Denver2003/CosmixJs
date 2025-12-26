#ifndef Boltrix_GameScene_h
#define Boltrix_GameScene_h
#include "cocos2d.h"
#include "Box2D.h"
#include "LevelHelperLoader.h"
#include "LevelLoader.h"


/// rezhim of falling figure
#define STATE_FIGURE_CREATE     0
#define STATE_FIGURE_FALL       1
#define STATE_FIGURE_CONTROL    2

#define LASER_STAY  0
#define LASER_FIND  1
#define LASER_KILL  2


#define COMBO_TIME              4

#define TAG_END_OF_LEVEL		999

#define TIME_GAME_OVER    10.0

#define POINTS_COLOR ccc3(255,0,0)
#define POINTS_FONT "Airmole Antique.ttf"
//#define POINTS_FONT_SIZE 20

#define FLOAT_POINTS_COLOR ccc3(255,255,255)
#define FLOAT_POINTS_COLOR1 ccc3(255,255,0)
#define FLOAT_POINTS_COLOR2 ccc3(0,255,0)
#define FLOAT_POINTS_COLOR3 ccc3(255,0,0)

#define COMBO_COLOR2 ccc3(255,255,0);
#define COMBO_COLOR3 ccc3(255,255,0);
#define COMBO_COLOR4 ccc3(255,255,0);
#define COMBO_COLOR5 ccc3(255,255,0);
#define COMBO_COLOR6 ccc3(255,255,0);

#define GAMESTATE_INIT      0
#define GAMESTATE_PLAY      1
#define GAMESTATE_PAUSE     2
#define GAMESTATE_GAMEOVER  3




#define FLOAT_POINTS_FONT "Airmole Antique.ttf"
//#define FLOAT_POINTS_FONT_SIZE 28

class GameScene : public cocos2d::CCLayer {
public:
	GameScene();
	~GameScene(void);

	static cocos2d::CCScene* scene();

    void tick(float dt);

    
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
	void initStarsAndPlanets();
    
    void scoreUpdate();
	void updateScorePosition();
	void scoreHitAtPosition(CCPoint position, int points);
    void scoreHit(int points);
	void removeScoreText(CCNode * node);
    void scoreFlyCreate(CCPoint point, int localScore);
    void scoreFlyRemove(CCNode * node);    
    
    void levelLabelUpdate();
    
    


// stage    
    void stageInitCollisionInit();
    void stageClearCollision();
// figure
	void figureCollideWithEOL(LHSprite * sprite);
	void figureUncollideWithEOL(LHSprite * sprite);
    void figureCreateNew();
    void figureEndOfPath(CCNode * node);
    void figureMakeDynamic(bool needCreateNew = true);
  	void figureTypeCollision(CCObject * object);
	void figureEndOfLevelCollision(cocos2d::CCObject *object);
	void changeColorNextFigure(CCNode * node, void * data);
    void changePositionNextFigure(CCNode * node);
	void endPulse(CCNode * node);
    void spriteAnimHasEnded(CCObject * object);
    
    void laserEndAnim(CCObject * object);
    
    
    void initNewGame();
    void destroyGameData();
    void initLevelHelperOnce();
    

    // game state and menu
    virtual void restartGame(CCObject* pSender); 
    void gameOver();

	//control
	   
    virtual void ccTouchesEnded	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesBegan	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesCancelled(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesMoved	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);

    void createMouseJoint(b2Vec2 locationWorld);

    
    int checkCombo(CCPoint pos);
	/// work with top sprites(eyes, bang and more)
	void setTopSpriteFor( LHSprite * parent, LHSprite * topSprite );
	LHSprite * removeTopSpriteFor( LHSprite * parent );
	LHSprite * getTopSpriteFor( LHSprite * parent );
	void updateTopSprites( void );
	LHSprite * createTopSpriteFor( LHSprite * parent);
	void removeAllTopSprites();
    
    
    CCRect boundBoxFromSprite(LHSprite * sprite);
    
    void preNewStage();
    void afterNewStage();
    
    void fallStatusStart();
    void fallStatusEnd();
    void fallStatusUpdate(float percent);
	/// for falling bonus
	void loadRespawnPoints();
	void fallRandomFigures();
    void fallOfFigureEnd(CCNode * node);
    
    void touchBeginOnSprite(CCObject* cinfo);
    void touchMovedOnSprite(CCObject* cinfo);
    void touchEndedOnSprite(CCObject* cinfo);    


	// DEBUG DRAW

	void draw( void );

    

public:
	map<LHSprite *, LHSprite *> topSprites;


    CCLayer *            levelLayer;
	CCLayer *            topLayer;
    
    b2World*            world;
    LevelHelperLoader * loader;

  	LevelPack *			levelPack;
	Level *				level;
	Quest *				quest;
    

	CCSize				winSize;

	LHSprite *          currentSprite; 
	LHSprite *          fallingSprite; 
  	LHSprite *          backingSprite; 
   	LHSprite *          prevBackingSprite; 
    
    LHSprite *          fallStatus;

    LHSprite *          buttonPause;
    
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
	float       timeToGameOver;
    bool        isWaitingGameOver;
	bool        isGameOver;
    
    Figure *    nextFigure;

	bool isInitialed;
	/// joints for move
    b2MouseJoint *		mouseJoint;
	b2PrismaticJoint *	prismaticJoint;
	
    
	
	map<LHSprite *,int> gameOverCollisions;
	

	int				score;
//	CCLabelTTF *	scoreLabel;
	int				figureCleared;
    
    LHSprite *      scoreSprites[8]; 
    LHSprite *      levelSprites[3]; 

	vector<CCPoint> respawnPoints;
	/// falling count rocket
	int fallingCount;
    
    
    int fontSizeScore;
    int fontSizeFloatScore;
    
    
	LHSprite* nextFigureSprite;
    float nextFigureXPosition;

    ///combo
    int     comboCount;
    float   comboTime;
    /// 
	float	stepOfShock;
	float	stepOfFallingFigure;

    LHSprite *  laserSprite;
    int         laserType;
	
    CCPoint     laserPoint;
    CCPoint     figureStartPoint;
    CCPoint     figureEndPoint;
    
    CCPoint     comboPoint;
    CCPoint     nextLevelPoint;
    CCPoint     levelAchivePoint;
    CCPoint     additionalPoint;
    
    
    float       ciferFlyDistance;
    float       ciferFlyWidth;
    
    int multiplier;
    LHBatch * typesBatch;

	LHBatch * ciferFlyBatch;
	
};
#endif