//
//  PlayScene.h
//  falling
//
//  Created by Den on 25.02.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef falling_PlayScene_h
#define falling_PlayScene_h

// When you import this file, you import all the cocos2d classes
#include "cocos2d.h"
#include "Box2D.h"
#include "LevelHelperLoader.h"

/// rezhim of falling figure
#define STATE_FIGURE_CREATE     0
#define STATE_FIGURE_FALL       1
#define STATE_FIGURE_CONTROL    2

#define TIME_GAME_OVER    3.0


class PlayScene : public cocos2d::CCLayer {
public:
    PlayScene(string _levelFileName);
    ~PlayScene();
    
    // returns a Scene that contains the HelloWorld as the only child
    static cocos2d::CCScene* scene(string _levelFileName);

    static PlayScene * playScene;
    
    //virtual void draw();
    
    /// обработчики нажитий с клавиатуры
    virtual void ccTouchesEnded(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesBegan(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesCancelled(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    virtual void ccTouchesMoved(cocos2d::CCSet* touches, cocos2d::CCEvent* event);
    /// обработчик акселерометра   
   void didAccelerate(CCAcceleration* pAccelerationValue);    
    // init
    void retrieveRequiredObjects(void);
    void setupCollisionHandling();
    void setupAudio();
    void setupScore();
    void scoreHitAtPosition(CCPoint position, int points);
    void scoreHit(int points);

    void removeScoreText(CCNode * node);
    
    void tick(cocos2d::ccTime dt);
    
    virtual void restartGame(CCObject* pSender); 
    void gameOver();
    
    void spriteAnimHasEnded(LHSprite* spr, const std::string& animationName);
    
    void figureCreateNew( );
    void figureEndOfPath(CCNode * node);
    void figureMakeDynamic();
	void figureTypeCollision(CCObject * object);
    ///loader->moveSpriteOnPathWithUniqueName
    
public:
    b2World*            world;
    string              levelFileName;
    LevelHelperLoader * loader;
    

    int                 score;
    CCLabelTTF *        scoreText;

    bool                touchControl;
    
    CCSize              winSize;
    

	CCRect              rectLeftBounds;
	CCRect              rectRightBounds;
    
    LHSprite *          currentSprite;
    
    int     stateFigure;
    float   curTickCount;
    
    //CCTouch* touchMove;
    //CCTouch* touchRotate;
    
    //CCPoint prevRotatePosition;
    CCPoint prevMovePosition;
    
    bool fastFallDown;
    float fastFallDownMaxTime;
    float fastFallDownCounter;
    CCTouch* touchFastFallDown;
    
    
    CCTouch* touchMoveRotate;  
	float	 spriteRotation;

	CCRect	rectGameOver;
	float	timeToGameOver;
    bool	isWaitingGameOver;
	bool	isGameOver;
};

#endif
