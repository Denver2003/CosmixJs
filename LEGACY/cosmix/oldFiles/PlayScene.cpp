//
//  PlayScene.cpp
//  falling
//
//  Created by Den on 25.02.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#include "PlayScene.h"
#include "SimpleAudioEngine.h"
#include "CStage.h"
#include "FigureUnit.h"

using namespace cocos2d;
using namespace CocosDenshion;

#define PTM_RATIO 32

PlayScene * PlayScene::playScene = NULL;

PlayScene::PlayScene(string _levelFileName){
    //CCDirector::sharedDirector()->enableRetinaDisplay(true);
	
    PlayScene::playScene = this;			///global singeltone
    
    world               = NULL;				///physics world
    levelFileName       = _levelFileName;	///level file name
    score               = 0;				///current score
    scoreText           = NULL;				///visual score component
    touchControl        = false;			///------------------
    
    currentSprite = NULL;					///current figure sprite
    CFigureUnit::clearSprites();			///clear sprites for new level
    
    stateFigure = 0;						/// current state of falling figure
    curTickCount = 0;						///
    
    
    fastFallDown            = false;		///state of fastfall action
    fastFallDownMaxTime     = 1;			/// max time for ff action
    fastFallDownCounter     = 0;			/// past time for ff state is cleared
    touchFastFallDown       = NULL;			/// touch object for ff action
    touchMoveRotate			= NULL;			/// touch object for move and rotate action

    rectLeftBounds.size.width   = 132;
    rectLeftBounds.size.height  = 96;    
    rectLeftBounds.origin.x     = -100;
    rectLeftBounds.origin.y     = 384;    

    rectRightBounds.size.width   = 132;
    rectRightBounds.size.height  = 96;    
    rectRightBounds.origin.x     = 288;
    rectRightBounds.origin.y     = 384;    
	spriteRotation				 = 0.0;
	
	
    rectGameOver.size.width		= 320;
    rectGameOver.size.height	= 2;    
    rectGameOver.origin.x		= 0;
    rectGameOver.origin.y		= 384;

	timeToGameOver				= 0.0;
	isWaitingGameOver			= false;
	isGameOver					= false;


    //CCUserDefault

    ;
//// loading level
    CStage::clearStages();
    
    string fullPath = CCFileUtils::fullPathFromRelativePath("levels.plist");
    
    CCDictionary<std::string, CCObject*> * dict = NULL;
    
    dict =  CCFileUtils::dictionaryWithContentsOfFile( fullPath.c_str()  );
    if( dict!=NULL ){
        /// search LEVELS node
        dict = (CCDictionary<std::string, CCObject*> *)dict->objectForKey("levels");
        if (dict) {
            /// search level
            dict = (CCDictionary<std::string, CCObject*> *) dict->objectForKey(_levelFileName);
            if (dict) {
                
                /// name of level file in LevelHelper
                CCString * scene = (CCString *)dict->objectForKey("scene");
                if (scene != NULL) {
                    levelFileName = scene->toStdString();
                }
                
                /// search stages from 1
                int stage = 1;
                CCDictionary<std::string, CCObject*> * stageDict = NULL;                    
                char num[30];
                sprintf( num, "stage%i", stage );
                stageDict = (CCDictionary<std::string, CCObject*> *)dict->objectForKey(num);
                while ( stageDict != NULL) {
                    /// search FIGURES node
                    
                    CStage::stageFromDict(stageDict);
                    
                    stage++;
                    sprintf( num, "stage%i", stage );
                    stageDict = (CCDictionary<std::string, CCObject*> *)dict->objectForKey(num);
                    
                }
                
            }
        }
    }
    
//// loading level end
    
    
    winSize             = CCDirector::sharedDirector()->getWinSize();
	setIsTouchEnabled( true );
	setIsAccelerometerEnabled( true );
    
	CCSize screenSize = CCDirector::sharedDirector()->getWinSize();

	b2Vec2 gravity;
	gravity.Set(0.0f, -10.0f);
	
	bool doSleep = true;
    
	// Construct a world object, which will hold and simulate the rigid bodies.
	world = new b2World(gravity);
    world->SetAllowSleeping(doSleep);    
	world->SetContinuousPhysics(true);
////////////////// LEVEL HELPER INIT HERE //////////////////////////////    
	loader = new LevelHelperLoader( string( levelFileName + ".plhs" ).c_str());
	loader->addObjectsToWorld(world, this);    
    
    if(loader->hasPhysicBoundaries())
        loader->createPhysicBoundaries(world);
    
    if(!loader->isGravityZero())
        loader->createGravity(world);
    
    // Add this
    retrieveRequiredObjects(); 
    // set up collision detections
    setupCollisionHandling();
    // set up audio
    setupAudio();
    /// set up and clear score points
    setupScore();
    /// create new figure
    figureCreateNew();    
////////////////// LEVEL HELPER INIT HERE ENDED ////////////////////////    
	/// run cycle
	schedule( schedule_selector(PlayScene::tick) );
    
    //CCDirector::sharedDirector()->enableRetinaDisplay(true);
}

PlayScene::~PlayScene(){

    map<int,int>::iterator it;// = CStage::uniqueFigureTags.begin();
	for( it = CStage::uniqueFigureTags.begin(); it != CStage::uniqueFigureTags.end(); it++){
		int tag = it->first;
		//int count = it->second;
		loader->cancelBeginOrEndCollisionCallbackBetweenTagA( (LevelHelper_TAG) tag, (LevelHelper_TAG)tag);
	}

	CFigureUnit::removeAllSprite();


    delete loader;
    loader = NULL;
	
    delete world;
	world = NULL;
	
	//delete m_debugDraw;
}

void PlayScene::tick(ccTime dt)
{
	//It is recommended that a fixed time step is used with Box2D for stability
	//of the simulation, however, we are using a variable time step here.
	//You need to make an informed choice, the following URL is useful
	//http://gafferongames.com/game-physics/fix-your-timestep/
	
	int velocityIterations = 8;
	int positionIterations = 2;
    
	// Instruct the world to perform a single step of simulation. It is
	// generally best to keep the time step and iterations fixed.
	world->Step(dt, velocityIterations, positionIterations);
	
    //Iterate over the bodies in the physics world
	for (b2Body* b = world->GetBodyList(); b; b = b->GetNext())	{
		if (b->GetUserData() != NULL)  {
			//Synchronize the AtlasSprites position and rotation with the corresponding body
			CCSprite *myActor = (CCSprite*)b->GetUserData();
            if(myActor != 0)            {
                myActor->setPosition (LevelHelperLoader::metersToPoints(b->GetPosition()));
                myActor->setRotation(-1 * CC_RADIANS_TO_DEGREES(b->GetAngle()));		
            }
        }	
	}

	if( isGameOver )
		return;

    if (stateFigure == STATE_FIGURE_CONTROL) {
        if (CStage::currentStage()!=NULL) {
            curTickCount += dt;
            if (curTickCount >= (CStage::currentStage()->waitingTime)) {
                figureMakeDynamic();
            }
            
        }
    }
    
    if (fastFallDown) {
        fastFallDownCounter += dt;
        if (fastFallDownCounter >= fastFallDownMaxTime) {
            fastFallDown = false;
        }
    }
    
    CFigureUnit::updateTime(dt);
	
	/// check game over interception 
	if( CFigureUnit::rectCollideWhithSprites( rectGameOver ) ){
		if( !isWaitingGameOver ){
			isWaitingGameOver = true;
			timeToGameOver = TIME_GAME_OVER;
		}
	}else{
		isWaitingGameOver = false;
	}

	if( isWaitingGameOver ){
		timeToGameOver = timeToGameOver - dt;
		if( timeToGameOver < 0 ){
			isGameOver = true;
			/// need to call Game Over Function
			gameOver();
		}
	}
}

void PlayScene::didAccelerate(CCAcceleration* pAccelerationValue){
    if( !touchControl ){
    }

}
/// управление нажатием
void PlayScene::ccTouchesBegan(cocos2d::CCSet* touches, cocos2d::CCEvent* event){
	if( isGameOver )
		return;

    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->locationInView() ); 
//            CCPoint location= CCDirector::sharedDirector()->convertToGL(                                                                        touch->locationInView(touch->view())                                                                        );
            if (touchMoveRotate == NULL) {
                touchMoveRotate = touch;
                prevMovePosition = location;
            }
            
            if ((currentSprite!=NULL) && (stateFigure == STATE_FIGURE_CONTROL)) {
                fastFallDown = true;
                fastFallDownCounter = 0;
                touchFastFallDown = touch;
                
                if (touchMoveRotate == touch) {
                    prevMovePosition = location;
                }
            }
        }
    }

}
void PlayScene::ccTouchesMoved(cocos2d::CCSet* touches, cocos2d::CCEvent* event){
	if( isGameOver )
		return;
        
		CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
                            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->locationInView() ); 
//                CCPoint location= CCDirector::sharedDirector()->convertToGL(
//                                                                            touch->locationInView(touch->view())
//                                                                            );
                if (touchFastFallDown == touch) {
                    fastFallDown        = false;
                    fastFallDownCounter = 0;
                    touchFastFallDown   = NULL;
                }

                if ((currentSprite!=NULL) && (stateFigure == STATE_FIGURE_CONTROL)) {
                    if (touch == touchMoveRotate) {
                        CCPoint prevPos         = currentSprite->getPosition();
                        float   prevRotation    = spriteRotation;//currentSprite->getRotation();
                        
                        float deltaX = prevMovePosition.x - location.x;
                        float deltaY = prevMovePosition.y - location.y;                        
                        
                        float   newDegrees      = deltaY;
						float   newX            = prevPos.x - deltaX;
                        
                        bool moveLeftRight = true;
                        if(abs(deltaY)>abs(deltaX))
                            moveLeftRight = false;
                        if (moveLeftRight) {
                            currentSprite->transformPosition(ccp(newX, prevPos.y));                            
                        }else{
                            if ( abs(newDegrees) > 0 ) {
								
								spriteRotation = spriteRotation + newDegrees;
								float rotation = spriteRotation;

								// align every 90 degreeses
								int cel = ((int)spriteRotation)/90;
								int ost = ((int)spriteRotation)%90;
									if( ost < 10 ){
										rotation = cel * 90;
									}
									if( (90 - ost) < 10 ){
										rotation = cel * 90 + 90;
									}
								CCLog( "real rotation: %f ostatok: %d cel: %d", spriteRotation, ost, cel );
                                currentSprite->transformRotation( rotation );
                            }
                        }

                        if( CCRect::CCRectIntersectsRect( rectLeftBounds, currentSprite->boundingBox()) ||
                           CCRect::CCRectIntersectsRect( rectRightBounds, currentSprite->boundingBox())){
                            if (moveLeftRight) {
                                currentSprite->transformPosition( prevPos );    
                            }else{
                                currentSprite->transformRotation( prevRotation );
                            }
                        }
                        prevMovePosition = location;
                    }
                }
            }
        }
}


void PlayScene::ccTouchesEnded(CCSet* touches, CCEvent* event){
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->locationInView() ); 
//            CCPoint location= CCDirector::sharedDirector()->convertToGL(
  //                                                                      touch->locationInView(touch->view())
    //                                                                    );
            if (touchFastFallDown == touch ) {
                if (fastFallDown) {
                    figureMakeDynamic();
                }
                fastFallDown        = false;
                fastFallDownCounter = 0;
                touchFastFallDown   = NULL;
            }

            /*
            if ( touchRotate == touch)  
                touchRotate = NULL;
            if ( touchMove == touch)  
                touchMove = NULL;
             
             */
            if ( touchMoveRotate == touch)  
                touchMoveRotate = NULL;
            
        }
    }
}

void PlayScene::ccTouchesCancelled(cocos2d::CCSet* touches, cocos2d::CCEvent* event){
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->locationInView() ); 
//            CCPoint location= CCDirector::sharedDirector()->convertToGL(
  //                                                                      touch->locationInView(touch->view())
    //                                                                    );
            if (touchFastFallDown == touch ) {
                if (fastFallDown) {
                    figureMakeDynamic();
                }
                fastFallDown        = false;
                fastFallDownCounter = 0;
                touchFastFallDown   = NULL;
            }
            
            /*
             if ( touchRotate == touch)  
             touchRotate = NULL;
             if ( touchMove == touch)  
             touchMove = NULL;
             
             */
            if ( touchMoveRotate == touch)  
                touchMoveRotate = NULL;
            
        }
    }
}

void  PlayScene::spriteAnimHasEnded(LHSprite* spr, const std::string& animationName)
{
}



CCScene* PlayScene::scene(string _levelFileName)
{
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::node();
    
    // add layer as a child to scene
    CCLayer* layer = new PlayScene( _levelFileName );
    scene->addChild(layer);
    layer->release();
    
    return scene;
}

//- перезапуск уровня
void PlayScene::restartGame(CCObject* pSender)
{
    unscheduleAllSelectors();
    CCDirector::sharedDirector()->replaceScene(PlayScene::scene(levelFileName));
}

// смерть игрока
void PlayScene::gameOver(){
	isGameOver = true;

	//SimpleAudioEngine::sharedEngine()->playEffect("lose.wav");
    
    //CCSize winSize = CCDirector::sharedDirector()->getWinSize();
    CCLabelTTF *label = CCLabelTTF::labelWithString("Game Over","Marker Felt",64);
    label->setColor(ccRED);
    label->setPosition(ccp(winSize.width*0.5, winSize.height*0.75));
    addChild( label, 10 );
    
    CCMenuItem *item = CCMenuItemFont::itemFromString("Restart",this, menu_selector(PlayScene::restartGame));
    CCMenu *menu = CCMenu::menuWithItems( item, NULL);
    menu->alignItemsVertically();
    
    addChild(menu);
}

///--------------------------------------
void PlayScene::retrieveRequiredObjects()
{
}
///--------------------------------------
/// настройка персечений
void PlayScene::setupCollisionHandling(){
    loader->useLevelHelperCollisionHandling();

	map<int,int>::iterator it;// = CStage::uniqueFigureTags.begin();
	for( it = CStage::uniqueFigureTags.begin(); it != CStage::uniqueFigureTags.end(); it++){
		int tag = it->first;
		//int count = it->second;
		loader->registerBeginOrEndCollisionCallbackBetweenTagA( (LevelHelper_TAG) tag, (LevelHelper_TAG)tag, this, callfuncO_selector(PlayScene::figureTypeCollision));
	}
	
/*
    loader->registerPreCollisionCallbackBetweenTagA(HERO, GROUND, this, callfuncO_selector(PlayScene::heroGroundCollision));
    loader->registerPreCollisionCallbackBetweenTagA(HERO, CEILING, this, callfuncO_selector(PlayScene::heroGroundCollision));
    loader->registerBeginOrEndCollisionCallbackBetweenTagA(HERO, PLATFORM, this, callfuncO_selector(PlayScene::heroOnPlatformCollision));

    loader->registerBeginOrEndCollisionCallbackBetweenTagA(HERO, STAR, this, callfuncO_selector(PlayScene::heroStarCollision));
    
    loader->registerBeginOrEndCollisionCallbackBetweenTagA(HERO, DIAMOND, this, callfuncO_selector(PlayScene::heroDiamondCollision));
    
    
    loader->registerBeginOrEndCollisionCallbackBetweenTagA(PLAYER, COIN, this, callfuncO_selector(HelloWorld::mouseCoinCollision));
    loader->registerPreCollisionCallbackBetweenTagA(PLAYER, LASER, this, callfuncO_selector(HelloWorld::mouseLaserCollision));
    loader->registerPreCollisionCallbackBetweenTagA(PLAYER, ROTATING_LASERS, this, callfuncO_selector(HelloWorld::mouseLaserCollision));
    
    
    loader->registerPreCollisionCallbackBetweenTagA(PLAYER,DOG, this, callfuncO_selector(HelloWorld::mouseDogCatCollision));
    loader->registerPreCollisionCallbackBetweenTagA(PLAYER,CAT, this, callfuncO_selector(HelloWorld::mouseDogCatCollision));
    
    loader->registerPreCollisionCallbackBetweenTagA(PLAYER, GROUND, this, callfuncO_selector(HelloWorld::mouseGroundCollision));
    
    
    loader->registerBeginOrEndCollisionCallbackBetweenTagA(PLAYER, BUNNY, this, callfuncO_selector(HelloWorld::mouseBunnyCollision));
    */
}
void PlayScene::figureTypeCollision(CCObject * object){
	LHContactInfo* contact = ( LHContactInfo* ) object;
	LHSprite * spriteA = contact->spriteA();
	

	LHSprite * spriteB = contact->spriteB();
	if( contact->contactType == LH_BEGIN_CONTACT ){
		CFigureUnit::collide( spriteA, spriteB );
        
		CCLOG("BEGIN contact whith %s and %s", spriteA->getUniqueName().c_str(),spriteB->getUniqueName().c_str());
	}
	if( contact->contactType == LH_END_CONTACT ){
		CFigureUnit::uncollide( spriteA, spriteB );
		CCLOG("END contact whith %s and %s", spriteA->getUniqueName().c_str(),spriteB->getUniqueName().c_str());
	}

}

///--------------------------------------
/// загрузка звуков и музыки
void PlayScene::setupAudio(){
    SimpleAudioEngine::sharedEngine()->playBackgroundMusic("backgroundMusic.m4a");
    SimpleAudioEngine::sharedEngine()->preloadEffect("coin.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("fly.wav");
    SimpleAudioEngine::sharedEngine()->preloadEffect("ground.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("hitObject.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("laser.wav");
    SimpleAudioEngine::sharedEngine()->preloadEffect("lose.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("bunnyHit.wav");*/
}
///--------------------------------------
/// настройка отображения очков
void PlayScene::setupScore()
{
    score = 0;
    
    CCSize winSize = CCDirector::sharedDirector()->getWinSize();
    //	CCTextAlignmentLeft,	CCTextAlignmentCenter,	CCTextAlignmentRight,
    scoreText = CCLabelTTF::labelWithString("Score: 0", CCSizeMake(200, 50), CCTextAlignmentLeft, "Arial" , 22);
    scoreText->setColor( ccWHITE );
    scoreText->setPosition(ccp(100, winSize.height-25));
    addChild(scoreText,20);    
}
///--------------------------------------
void PlayScene::scoreHit(int points){
    score += points;
    
    char curScoreTxt[40]; 
    sprintf(curScoreTxt, "Score: %d",score );
    scoreText->setString(curScoreTxt);
    
}

///--------------------------------------
void PlayScene::scoreHitAtPosition(CCPoint position, int points){    
    score += points;
    
    char curScoreTxt[40]; 
    sprintf(curScoreTxt, "Score: %d",score );
    scoreText->setString(curScoreTxt);
    if (position.x!=0 && position.y!=0) {
        sprintf(curScoreTxt, "+ %d", points );
        CCLabelTTF *curScore = CCLabelTTF::labelWithString(curScoreTxt, "Marker Felt",24);
        curScore->setColor(ccWHITE);
        curScore->setPosition(position);
        addChild(curScore,20);
        
        CCFadeTo *      fadeAction      = CCFadeTo::actionWithDuration(1, 0 );
        CCCallFuncN *   funcAction      = CCCallFuncN::actionWithTarget(this, callfuncN_selector(PlayScene::removeScoreText));
        curScore->runAction(CCSequence::actionOneTwo(fadeAction, funcAction));
    }
    
    
}
///--------------------------------------
void PlayScene::removeScoreText(CCNode * node){
	CCLabelTTF * scoreLabel = (CCLabelTTF *) node;
    if( scoreLabel ){
        scoreLabel->removeFromParentAndCleanup(true);
    }
}
///--------------------------------------
/// create new falling figure sprite
void PlayScene::figureCreateNew(){
    LHBezierNode * startPath = loader->bezierNodeWithUniqueName("startPath");
    if( startPath ){
        CFigure * figure = CStage::randomFigure();
        if (figure!=NULL) {
            LHSprite* figureSprite = loader->newPhysicalBatchSpriteWithUniqueName(figure->spriteName);
            figureSprite->getBody()->SetType(b2_staticBody);
            figureSprite->moveOnPathWithUniqueName("startPath", 1, false, false, false, 0, false, false, false  );
            figureSprite->registerNotifierOnPathEndPoints(this, callfuncN_selector(PlayScene::figureEndOfPath));
            figureSprite->setTag(figure->tag);
            figureSprite->setColor(cocos2d::ccc3(200, 0, 0));
            currentSprite = figureSprite;
            stateFigure = STATE_FIGURE_FALL;
			CFigureUnit::createUnitForSprite( currentSprite, NULL );
			spriteRotation = currentSprite->getRotation();
            

            
            
			//createUnitForSprite
        }
        
    }

}
//// callback when we can control position of figure 
void PlayScene::figureEndOfPath(CCNode * node)
{
    LHSprite* sprite = (LHSprite*) node;
    LHPathNode* path = sprite->getPathNode();
    if( path->getUniqueName() == "startPath" ){
        
        curTickCount = 0;
        stateFigure = STATE_FIGURE_CONTROL;
        /// we can control the figure
    }
}
/// vfrt figure dynamic for it fall down physicly
void PlayScene::figureMakeDynamic(){
    if (currentSprite!=NULL) {
        currentSprite->getBody()->SetType(b2_dynamicBody);
        CFigureUnit::addSprite(currentSprite);
        scoreHit(50);
        //loader->removeSprite(currentSprite);
    }
    ///create next figure
	if( isGameOver )
		return;


    figureCreateNew();
}





