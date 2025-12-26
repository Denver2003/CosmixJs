#include "GameScene.h"
#include "MainMenuScene.h"
#include "SimpleAudioEngine.h"
#include "FigureUnit.h"
#include "Bonus.h"
#include "Effect.h"
#include "quest.h"
#include "QuestItem.h"
#include "params.h"

#include "Game.h"

/// debug
//#include "b2DebugDraw.h"

using namespace cocos2d;
using namespace CocosDenshion;

GameScene * GameScene::gameScene = NULL;

GameScene::GameScene()
{
	CCLog("GameScene::GameScene()");
	GameScene::gameScene	= this;
	world					= NULL;				///physics world
	// size of screen
	winSize             = CCDirector::sharedDirector()->getWinSize();
    // set touch
	setTouchEnabled( true );
	// set up accelerometer
	setAccelerometerEnabled( true );
	// step of shock 
	stepOfShock				= winSize.height * 0.05;
	stepOfFallingFigure		= winSize.height * 0.001;
    fallStatus              = NULL;
	fallingCount			= 0;
    
    

	world = Game::getWorld();
	

	addChild(Game::getGameLayer(), 1);

////////////////// LEVEL HELPER INIT HERE //////////////////////////////    
	loader = Game::getLoader();

    initLevelHelperOnce();
    
    initNewGame();
////////////////// LEVEL HELPER INIT HERE ENDED ////////////////////////   
    
    
	/// run cycle
	schedule( schedule_selector(GameScene::tick) );

    
    
    
}

void GameScene::draw( void )
{
}


// инициализация лоадера уровня(LevelHelper)
void GameScene::initLevelHelperOnce(  )
{
	CCLog("GameScene::initLevelHelper");
    
	/* DEBUG DRAW */
	/*b2DebugDraw *debugDraw = new b2DebugDraw(loader->meterRatio());
	world->SetDebugDraw(debugDraw);
	uint32 flags = 0;
	flags += b2Draw::e_shapeBit;
	flags += b2Draw::e_jointBit;
	flags += b2Draw::e_centerOfMassBit;
	flags += b2Draw::e_aabbBit;
	flags += b2Draw::e_pairBit;
	debugDraw->SetFlags(flags);
     */
    /* DEBUG DRAW */

	/*
	ciferFlyBatch	= LHBatch::batchWithSheetName( "labels" , "labels.pshs");
	typesBatch		= LHBatch::batchWithSheetName( "newTypes" , "newTypes.pshs");
	levelLayer->addChild(ciferFlyBatch);
	levelLayer->addChild(typesBatch);

	*/

    laserSprite = loader->spriteWithUniqueName("laser");
    if (laserSprite) {
		laserSprite->prepareAnimationNamed("laser_stay","laser.pshs");
		laserSprite->playAnimation();
        laserType = LASER_STAY;
    }
    
    LHSprite * tmpSprite = loader->spriteWithUniqueName("laserPoint");
    if (tmpSprite) {
        laserPoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
        rectGameOver.origin.x = 0;
        rectGameOver.origin.y = laserPoint.y;
        rectGameOver.size.width = winSize.width;
        rectGameOver.size.height = 1;
    }
    
    tmpSprite = loader->spriteWithUniqueName("figureBeginPoint");
    if (tmpSprite) {
        figureStartPoint = tmpSprite->getPosition();
        BonusItem::bubbleEndPoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
    }
    
    tmpSprite = loader->spriteWithUniqueName("figureEndPoint");
    if (tmpSprite) {
        figureEndPoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
    }

	//TEMP
	// remove this bloack after "figureBeginPoint" was added!!!!
		figureStartPoint = figureEndPoint;
		figureStartPoint.y = figureEndPoint.y + 200;
		BonusItem::bubbleEndPoint = figureStartPoint;
	//TEMP
    
    ciferFlyDistance = 0;
    ciferFlyWidth = 0;
    tmpSprite = loader->spriteWithUniqueName("cifPointBegin");
    if (tmpSprite) {
        CCPoint endPnt;
        CCPoint begPnt = tmpSprite->getPosition();
        ciferFlyWidth = tmpSprite->boundingBox().size.width;
		tmpSprite->removeSelf();
        
        
        tmpSprite = loader->spriteWithUniqueName("cifPointEnd");
        if (tmpSprite) {
            endPnt = tmpSprite->getPosition();
			tmpSprite->removeSelf();
            ciferFlyDistance = endPnt.x - begPnt.x;
        }
        
    }
    
    tmpSprite = loader->spriteWithUniqueName("comboPoint");
    if (tmpSprite) {
        comboPoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
    }
    
    tmpSprite = loader->spriteWithUniqueName("nextLevelPoint");
    if (tmpSprite) {
        nextLevelPoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
    }
    
    tmpSprite = loader->spriteWithUniqueName("levelAchivePoint");
    if (tmpSprite) {
        levelAchivePoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
    }
    
    tmpSprite = loader->spriteWithUniqueName("additionalPoint");
    if (tmpSprite) {
        additionalPoint = tmpSprite->getPosition();
		tmpSprite->removeSelf();
    }
    
    
    buttonPause = loader->spriteWithUniqueName("megabomb");
    if (buttonPause) {
        buttonPause->registerTouchBeganObserver(this, callfuncO_selector(GameScene::touchBeginOnSprite));
        buttonPause->registerTouchMovedObserver(this, callfuncO_selector(GameScene::touchMovedOnSprite));
        buttonPause->registerTouchEndedObserver(this, callfuncO_selector(GameScene::touchEndedOnSprite));
    }
    
    setupScore();
    
    setupLevelLabel();
    
    
    // set up audio
    setupAudio();

    
}

/// инициализация новой игры
/// запускается при перезапуске уровня
void GameScene::initNewGame()
{
	CCLog("GameScene::initNewGame()");
    
	// clear old collision colors
    fastFallDown            = false;
    fastFallDownMaxTime     = 1;
    fastFallDownCounter     = 0;
    touchFastFallDown       = NULL;
    spriteRotation          = 0;
    touchMoveRotate         = NULL;  

	//rectGameOver;//!!!!!!!!!!!!
    timeToGameOver          = 0;
    isWaitingGameOver       = false;
    isGameOver              = false;
    
    nextFigure              = NULL;
	nextFigureSprite		= NULL;
    
    nextFigureXPosition     = winSize.width/2;
    
    
	isInitialed				= false;
	mouseJoint				= NULL;
	prismaticJoint			= NULL;
    
	score					= 0;
	figureCleared			= 0;
    
    fallingSprite           = NULL;
    backingSprite           = NULL;
    prevBackingSprite       = NULL;
    
    prevVelocityY           = 0;
    
    comboCount              = 0;
    comboTime               = 0;

    
    currentSprite           = NULL; 
    fallingSprite           = NULL; 
    backingSprite           = NULL; 
    prevBackingSprite       = NULL; 
    fallStatus              = NULL;
    
    stateFigure = STATE_FIGURE_CREATE;
    
    ///load all
    params::getInstance()->loadAll();
    
	levelPack = LevelLoader::getInstance()->getCurLevelPack();
	if( !levelPack ){
		CCLOG("NOT FOUND LEVEL PACK");
        return;
    }
    
    quest = levelPack->getCurQuest();
    if (!quest) {
		CCLOG("NOT FOUND QUEST");
        return;
    }
    
    QUESTS->init(quest);
    
    multiplier = quest->multiplier;
    
    
	level = LevelLoader::getInstance()->getCurLevel();
	if( !level ){
		CCLOG("NOT FOUND LEVEL");
        return;
    }
    // init new level parameters
    LevelLoader::getInstance()->initNewLevel();
    
    // randomize
    srand(time(NULL));
    CCRANDOM_0_1();

    
    CFigureUnit::initUnits();
    
    scoreUpdate();
    
    levelLabelUpdate();
    
    setupCollisionHandling();
    
    
}

void GameScene::destroyGameData()
{
	CCLog("GameScene::destroyGameData()");
	/*
    params::getInstance()->saveAll();
    
    stageClearCollision();
    
	BonusItem::destroyAllItems();
    
	CFigureUnit::removeAllSprite( true );
    
    if (currentSprite) {
        LHSprite * topSprite = removeTopSpriteFor(currentSprite);
        if (topSprite) {
        
			topSprite->removeSelf();
			topSprite = NULL;
        }
        
		currentSprite->removeSelf();
        currentSprite = NULL;
    }
    
    if (backingSprite) {
		backingSprite->removeSelf();
		backingSprite = NULL;
    }

    if (prevBackingSprite) {
		prevBackingSprite->removeSelf();
		prevBackingSprite = NULL;

    }

    
    if (fallStatus) {
		fallStatus->removeSelf();
    }
    
    
    removeAllTopSprites();
    
    int size = topSprites.size();
    if (size > 0) {
        CCLOG("JOOOOOOOOOOPPPPPPPPAAAAAAAAA %i", size);
    }

    size = CFigureUnit::allSprites.size();
    if (size > 0) {
        CCLOG("JOOOOOOOOOOPPPPPPPPAAAAAAAAA 222 %i", size);
    }

     */
    
    
}

GameScene::~GameScene(void)
{
	CCLog("GameScene::~GameScene(void)");
	
    params::getInstance()->saveAll();
    
	/*
    stageClearCollision();
    
	BonusItem::destroyAllItems();

	CFigureUnit::removeAllSprite();
    */
    
	Game::destroyInstance();	
	
	//delete m_debugDraw;
}


CCScene* GameScene::scene()
{
	CCLog("CCScene* GameScene::scene()");
    // 'scene' is an autorelease object
    CCScene *scene = CCScene::create();
    
    // add layer as a child to scene
    GameScene* layer = new GameScene();
    scene->addChild(layer);

	//layer->release();
    
    return scene;
}
//-------------------------------------------
// init data first time per start level
//-------------------------------------------
void GameScene::initFirst()
{
	
	if( !isInitialed ){
		
		CCLog("void GameScene::initFirst()");

		isInitialed = true;

		// init bonuses for level
		Bonus::initBonuses();

		loadRespawnPoints();

		//initStarsAndPlanets();

		clearTemplatesFromLevel();

		/// create new figure
		figureCreateNew();
	}
}

///--------------------------------------
///   UPDATE CYCLE
///--------------------------------------
void GameScene::tick(float dt)
{
	//CCLog("GameScene::tick");
	//It is recommended that a fixed time step is used with Box2D for stability
	//of the simulation, however, we are using a variable time step here.
	//You need to make an informed choice, the following URL is useful
	//http://gafferongames.com/game-physics/fix-your-timestep/
	
	int velocityIterations = 8;
	int positionIterations = 8;
    
	initFirst();

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
    
	//-------------------------------------------------------------
	// update other sprites

	//updateTopSprites();

    /*if (currentSprite && backingSprite) {
        backingSprite->setPosition(currentSprite->getPosition());
        backingSprite->setRotation(currentSprite->getRotation());
    }
    //-------------------------------------------------------------
    
    */


	if( isGameOver )
		return;

	//-------------------------------------------------------------
	// FALL STATUS
    /*
    if (stateFigure == STATE_FIGURE_CONTROL) {
        Stage * stg = LevelLoader::getInstance()->getCurStage(); 
        if ( stg!=NULL) {
            curTickCount += dt;
            if(stg->waiting_time > 0)
                fallStatusUpdate( 100.0 - ((100.0 * curTickCount) / stg->waiting_time) );
            
            if (curTickCount >= (stg->waiting_time)) {
				CCLOG("tick: free figure to fly automatically!");
                figureMakeDynamic();
                fastFallDown = false;
            }
        }else{
			CCLOG("tick: NOT FOUND STAGE!");
		}
    }
	//--------------------------------------------------------
	*/
    
	//--------------------------------------------------------
	// ALIEN CONTROL UPDATE

    if (fastFallDown) {
        fastFallDownCounter += dt;
        if (fastFallDownCounter >= fastFallDownMaxTime) {
            fastFallDown = false;
        }
    }
    
    if (comboTime > 0 ) {
        comboTime -= dt;
        if (comboTime <= 0) {
            comboTime = 0;
            comboCount = 0;
			CCLOG("tick: COMBOTIME is out");
        }
    }
	//--------------------------------------------------------
    

	//--------------------------------------------------------
	// CHECK ON FALLING SPRITE SPEED FOR BOOMs ANIMATION
	/*
    if (fallingSprite) {
        if (fallingSprite->getBody()) {
            b2Vec2 vec = fallingSprite->getBody()->GetLinearVelocity() ;
           
            if (abs(vec.y - prevVelocityY) > 2) {
                CFigureUnit * unit = CFigureUnit::unitFromSprite(fallingSprite);
                if (unit->animState!=ANIM_STATE_BLINKING) {
                    unit->animFigure(ANIM_STATE_BLINKING);  
					levelLayer->runAction( CCSequence::create(
						CCMoveTo::create( 0.1, ccp( 0, -stepOfFallingFigure)),
						CCMoveTo::create( 0.1, ccp( 0, 0)),
						NULL
						));

					fallingSprite->runAction( CCSequence::create( 
						CCScaleTo::create( 0.1, 1.1, 0.9 ),
						CCScaleTo::create( 0.1, 0.95, 1.05),
						CCScaleTo::create( 0.1, 1.02, 0.98 ),
						CCScaleTo::create( 0.1, 1, 1),
						NULL
						));
                }
            }
                prevVelocityY = vec.y;
        }
    }
	*/
    //--------------------------------------------------------

	//--------------------------------------------------------
	// UPDATE ALIENS LIFE CYCLE(BLINKING, TIME TO CLEAR and etc.)
	/*
    CFigureUnit::updateTime(dt);
    */

	//----------------------------------------------------------
	//UPDATE BONUSES
	/*
    Bonus::updateBonuses(dt);
	*/
	//----------------------------------------------------------
	
	
	//----------------------------------------------------------
	/// check game over interception -------------------------
    // TO DO 
    // change game over check action !!!!!!!!
	/*
	if( CFigureUnit::rectCollideWhithSprites( rectGameOver ) ){

        if (laserType != LASER_FIND) {
            laserType = LASER_FIND;
            if (laserSprite) {
				laserSprite->prepareAnimationNamed( "laser_find", "laser.pshs" );
				laserSprite->playAnimation();
				CCNotificationCenter::sharedNotificationCenter()->addObserver( 
					this,
					callfuncO_selector( GameScene::laserEndAnim ),
					LHAnimationHasEndedNotification,
					laserSprite
					);
            }
        }
        
	//if( gameOverCollisions.size() > 0 ){
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
                laserType = LASER_KILL;
                if (laserSprite) {
					laserSprite->prepareAnimationNamed( "laser_kill", "laser.pshs" );
					laserSprite->playAnimation();
                }
			gameOver();
		}
	}
	*/
	//----------------------------------------------------------
 
}

void GameScene::laserEndAnim(CCObject * object)
{
	CCLog("GameScene::laserEndAnim(CCObject * object)");
	/*
    LHSprite * sprite = (LHSprite *)object;
    if (sprite) {
        if (laserType == LASER_FIND) {
            laserType = LASER_STAY;
            if (laserSprite) {
				laserSprite->prepareAnimationNamed( "laser_stay", "laser.pshs" );
				laserSprite->playAnimation();
                
				// old version
				//laserSprite->startAnimationNamed( "laser_stay");
            }
            
        }
    }
	*/
}

///--------------------------------------
///   SETUP
///--------------------------------------
/// 
void GameScene::setupCollisionHandling(){
    loader->useLevelHelperCollisionHandling();
    stageInitCollisionInit();
}

/// загрузка звуков и музыки
void GameScene::setupAudio()
{
    /*
    SimpleAudioEngine::sharedEngine()->playBackgroundMusic("backgroundMusic.m4a");
    SimpleAudioEngine::sharedEngine()->preloadEffect("coin.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("fly.wav");
    SimpleAudioEngine::sharedEngine()->preloadEffect("ground.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("hitObject.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("laser.wav");
    SimpleAudioEngine::sharedEngine()->preloadEffect("lose.wav");
    //SimpleAudioEngine::sharedEngine()->preloadEffect("bunnyHit.wav");
    */
    
}

///--------------------------------------
/// настройка отображения номера уровня
bool GameScene::setupLevelLabel()
{
    /*
	CCLog("GameScene::setupLevelLabel");

    levelSprites[0] = loader->spriteWithUniqueName("level1");
    levelSprites[1] = loader->spriteWithUniqueName("level2");
    levelSprites[2] = loader->spriteWithUniqueName("level3");
    
    for (int i=0; i<3; i++){
        if (levelSprites[i] == NULL) {
            return false;
        }
    }
    
    //levelLabelUpdate();
	*/
    return true;

}
///--------------------------------------
/// настройка отображения очков
bool GameScene::setupScore()
{
	/*   
	CCLog("GameScene::setupScore()");
	score = 0;
    
    scoreSprites[0] = loader->spriteWithUniqueName("score1");
    scoreSprites[1] = loader->spriteWithUniqueName("score2");
    scoreSprites[2] = loader->spriteWithUniqueName("score3");
    scoreSprites[3] = loader->spriteWithUniqueName("score4");
    scoreSprites[4] = loader->spriteWithUniqueName("score5");
    scoreSprites[5] = loader->spriteWithUniqueName("score6");
    scoreSprites[6] = loader->spriteWithUniqueName("score7");
    scoreSprites[7] = loader->spriteWithUniqueName("score8");

    for (int i=0; i<8; i++){
        if (scoreSprites[i] == NULL) {
            return false;
        }
    }
    
    //scoreUpdate();
    
        */
    return true;
}


void GameScene::scoreFlyCreate(CCPoint point, int localScore)
{
	CCLog("GameScene::scoreFlyCreate(CCPoint point, int localScore)");
	/*  
    int tempScore = localScore;
    char  animation[40];
    vector<LHSprite *> sprites;
    CCCallFuncN *   funcAction  = CCCallFuncN::create(this, callfuncN_selector(GameScene::scoreFlyRemove));
    vector<CCAction *> actions  = Effect::pointsFly( funcAction );
    
    
    
    while (tempScore != 0) {
        
        int ostatok = tempScore % 10;
        tempScore = tempScore / 10;
        
        sprintf(animation, "cifFly%d",ostatok );
        
        //LHSprite * ciferSprite = loader->newBatchSpriteWithUniqueName("ciferFlyPoints_1");
		LHSprite * ciferSprite = LHSprite::batchSpriteWithName("ciferFlyPoints_1",ciferFlyBatch);
			//newBatchSpriteWithUniqueName("ciferFlyPoints_1");

        if (ciferSprite) {
            ciferSprite->stopAllActions();            
			ciferSprite->prepareAnimationNamed(animation,"labels.pshs");
			ciferSprite->playAnimation();
            //ciferSprite->startAnimationNamed(string(animation));

            actions  = Effect::pointsFly( funcAction );

            
            for (int j = 0; j < actions.size(); j++) {
                ciferSprite->runAction(actions[j]);
            }
            
            
            sprites.push_back(ciferSprite);
        }
    }
    
    sprintf(animation, "cifFlyPlus" );
    /// add plus
    //LHSprite * ciferSprite = loader->newBatchSpriteWithUniqueName("ciferFlyPoints_1");
	LHSprite * ciferSprite = LHSprite::batchSpriteWithName("ciferFlyPoints_1",ciferFlyBatch);
    if (ciferSprite) {
        ciferSprite->stopAllActions();            
		ciferSprite->prepareAnimationNamed(animation,"labels.pshs");
		ciferSprite->playAnimation();
        actions  = Effect::pointsFly( funcAction );
        
        for (int j = 0; j < actions.size(); j++) {
            ciferSprite->runAction(actions[j]);
        }
        
        
        sprites.push_back(ciferSprite);
    }
    CCPoint pnt = point;
    float fullWidth = ciferFlyDistance * sprites.size();
    pnt.x = pnt.x - (fullWidth / 2) + (ciferFlyWidth / 2);
    
    
    for (int i = sprites.size() - 1; i >= 0 ; i-- ) {
        sprites[i]->setPosition(pnt);

        
        pnt.x += ciferFlyDistance;
    }
    
    
    */
}

void GameScene::scoreFlyRemove(CCNode * node)
{
	/*
	CCLog("GameScene::scoreFlyRemove(CCNode * node)");

    LHSprite * sprite = (LHSprite *)node;
    if (sprite) {
        ///loader->removeSprite(sprite);
		sprite->removeSelf();
    }
	*/
}


void GameScene::scoreUpdate()
{
	/*
	CCLog("GameScene::scoreUpdate()");

    int ostatok = 0;
    int tempScore = score;
    
    for (int i = 0; i < 8; i++) {
        char  animation[40];

        if (scoreSprites[i]) {
            ostatok     = tempScore % 10;
            tempScore   = tempScore / 10;
            
            sprintf(animation, "cifPnt%d",ostatok );

            scoreSprites[i]->stopAllActions();         
			scoreSprites[i]->prepareAnimationNamed(string(animation),"labels.pshs");
			scoreSprites[i]->playAnimation();

            ///scoreSprites[i]->startAnimationNamed(string(animation));
            scoreSprites[i]->runAction( Effect::Bubble(1, 0.5) );
        }
    }
	*/
}

void GameScene::levelLabelUpdate()
{
	CCLog("GameScene::levelLabelUpdate()");
	/*
    
    int ostatok = 0;
    int tempLevel = LevelLoader::getInstance()->curStageNumber;
    
    for (int i = 0; i < 3; i++) {
        char  animation[40];
        
        if (levelSprites[i]) {
            ostatok     = tempLevel % 10;
            tempLevel   = tempLevel / 10;
            
            sprintf(animation, "cifPnt%d",ostatok );
            
            levelSprites[i]->stopAllActions();            
			levelSprites[i]->prepareAnimationNamed(string(animation),"labels.pshs");
			levelSprites[i]->playAnimation();
            
            levelSprites[i]->runAction( Effect::Bubble(1, 0.5) );
        }
    }
	*/
}


void GameScene::loadRespawnPoints()
{
	CCLog("GameScene::loadRespawnPoints()");

	CCArray * tmpSprites =  loader->spritesWithTag( RESPAWN );
	if( tmpSprites ){
		for(unsigned int i=0; i < tmpSprites->count(); i++ ){
			LHSprite * sprite = (LHSprite *)tmpSprites->objectAtIndex( i );
			if(sprite){
				respawnPoints.push_back( sprite->getPosition() );
				sprite->removeSelf();
				sprite = NULL;
			}
		}
		tmpSprites->removeAllObjects();
		//tmpSprites->autorelease();
	}
	
	//LHSprite::remove
	//loader->removeSpritesWithTag( RESPAWN );
}

void GameScene::clearTemplatesFromLevel()
{
	CCLog("GameScene::clearTemplatesFromLevel()");
	CCArray * tmpSprites =  loader->spritesWithTag( TEMPLATE );
	if( tmpSprites ){
		for(unsigned int i=0; i < tmpSprites->count(); i++ ){
			LHSprite * sprite = (LHSprite *)tmpSprites->objectAtIndex( i );
			if(sprite){
				sprite->removeSelf();
				sprite = NULL;
			}
		}
		delete tmpSprites;
	}
}
//----------------------------------
// STAGE FUNCTIONS 
//----------------------------------
// init figures collision hanfler function
// need call after stage changed
void GameScene::stageInitCollisionInit()
{
	CCLog("GameScene::stageInitCollisionInit()");

	map<int,ccColor3B> allTagsForever;
	allTagsForever.insert(make_pair(TAG_FROM,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 1,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 2,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 3,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 4,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 5,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 6,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 7,ccc3(0,0,0)));

	map<int,ccColor3B>::iterator it = allTagsForever.begin();
	for( ; it != allTagsForever.end(); it++){
		int tag = it->first;
		loader->registerBeginOrEndCollisionCallbackBetweenTagA( (LevelHelper_TAG) tag, (LevelHelper_TAG)tag, this, callfuncO_selector(GameScene::figureTypeCollision));
	}

    
}
// clear handler collide functions after stage changed
void GameScene::stageClearCollision()
{
	CCLog("GameScene::stageClearCollision()");

	map<int,ccColor3B> allTagsForever;
	allTagsForever.insert(make_pair(TAG_FROM,	ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 1,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 2,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 3,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 4,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 5,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 6,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 7,ccc3(0,0,0)));

	map<int,ccColor3B>::iterator it = allTagsForever.begin();
	for( ; it != allTagsForever.end(); it++){
		int tag = it->first;
		loader->cancelBeginOrEndCollisionCallbackBetweenTagA( (LevelHelper_TAG) tag, (LevelHelper_TAG)tag);
	}
}

//----------------------------------
// FIGURE FUNCTIONS
//----------------------------------
void GameScene::figureTypeCollision(cocos2d::CCObject *object)
{
	CCLog("GameScene::figureTypeCollision(cocos2d::CCObject *object)");

    LHContactInfo* contact = ( LHContactInfo* ) object;
    LHSprite * spriteA = contact->spriteA();
    
    
    LHSprite * spriteB = contact->spriteB();
    /*if( contact->contactType == LH_BEGIN_CONTACT ){
        CFigureUnit::collide( spriteA, spriteB );
        
        //CCLOG("BEGIN contact whith %s and %s", spriteA->getUniqueName().c_str(),spriteB->getUniqueName().c_str());
    }
    if( contact->contactType == LH_END_CONTACT ){
        CFigureUnit::uncollide( spriteA, spriteB );
        //CCLOG("END contact whith %s and %s", spriteA->getUniqueName().c_str(),spriteB->getUniqueName().c_str());
    }
	*/
}

///--------------------------------------
/// create new falling figure sprite
void GameScene::figureCreateNew()
{
	CCLog("GameScene::figureCreateNew()");

    //LHBezierNode * startPath = loader->bezierNodeWithUniqueName("startPath");
    if( true ){
        Stage * stg = LevelLoader::getInstance()->getCurStage();
        if (!stg) {
            CCLOG("NOT FOUND CURRENT STAGE");
            return;
        }
        
        if (!nextFigure) {
			
            nextFigure = stg->randomFigure();
			CCLOG("GameScene::figureCreateNew first generate of new figure %i",nextFigure);
        }
        
        Figure * figure = nextFigure;
        /// random angle for new figure

        float angle = stg->rotationAngle * 2;

		
        float rndFigureAngle = CCRANDOM_0_1() * angle - (angle / 2);

        /// generate new figure
        nextFigure = stg->randomFigure();
		CCLOG("GameScene::figureCreateNew generate of next figure %i",nextFigure);

       if (figure!=NULL) {
            LHSprite* figureSprite = loader->createBatchSpriteWithUniqueName(figure->getSpriteName());
			//figureSprite->set
			//LHSprite* figureSprite = LHSprite::batchSpriteWithName(figure->getSpriteName(), typesBatch);

			//CCLOG("GameScene::figureCreateNew create non physic sprite %s",figureSprite->getUniqueName().c_str());

			if(figureSprite == NULL){
				CCLOG("GameScene::figureCreateNew NO SPRITE DATA for %s",figure->getSpriteName().c_str());
				return;
			}



           
           figureSprite->setTag(figure->tag);
           figureSprite->setColor(figure->color);

		   figureSprite->prepareAnimationNamed(figure->getAnimWalkName(),"newTypes.pshs");
		   figureSprite->playAnimation();

           //figureSprite->startAnimationNamed( figure->getAnimWalkName());

           currentSprite = figureSprite;
           stateFigure = STATE_FIGURE_FALL;
           CFigureUnit * fu = CFigureUnit::createUnitForSprite( currentSprite, figure );
           fu->animFigure( ANIM_STATE_NORMAL );
           createTopSpriteFor( currentSprite );


			//spriteRotation = currentSprite->getRotation();
			
           figureSprite->setPosition( figureStartPoint );
           ///start point 
           //CCMoveTo::create( 1, ccp( x, y ));
           CCCallFuncN * funcPosition = CCCallFuncN::create(this, callfuncN_selector(GameScene::figureEndOfPath));
			
           figureSprite->runAction( CCRotateTo::create( 0.6, rndFigureAngle ));
           figureSprite->runAction( CCSequence::create( CCMoveTo::create( 0.7, figureEndPoint ),funcPosition,NULL));

            //-------------------------------------------
			// backing sprite proccess
            if (backingSprite) {
                if (prevBackingSprite) {
					prevBackingSprite->removeSelf();
                    //loader->removeSprite(prevBackingSprite);    
                }
                prevBackingSprite = backingSprite;
                
                prevBackingSprite->setOpacity(100);
                CCScaleTo * scale1  = CCScaleTo::create(0.7, 2);
                CCFadeOut * fade1   = CCFadeOut::create(0.7);
                CCMoveBy * move1   = CCMoveBy::create(0.7, ccp(0,-20));

                prevBackingSprite->stopAllActions();
                prevBackingSprite->runAction(scale1);
                prevBackingSprite->runAction(fade1);
                prevBackingSprite->runAction(move1);                
                
            }
            
            //backingSprite = LHSprite::batchSpriteWithName(figure->getSpriteName(), typesBatch);
			backingSprite = loader->createBatchSpriteWithUniqueName(figure->getSpriteName());
            backingSprite->setColor(ccc3( 255,255,255));
            backingSprite->setPosition(currentSprite->getPosition());
            backingSprite->setRotation(currentSprite->getRotation());
            backingSprite->setScale(1.1);
            backingSprite->setOpacity(100);
            
            CCFadeTo * fadein   = CCFadeTo::create(0.3, 200);
            CCFadeTo * fadeout  = CCFadeTo::create(0.3, 50);
            CCScaleTo * scaleTo1 = CCScaleTo::create(0.3, 1.15);
            CCScaleTo * scaleTo2 = CCScaleTo::create(0.3, 1.05);           
            backingSprite->runAction(CCRepeatForever::create( (CCSequence*)CCSequence::create( fadein, fadeout, NULL ) ) );
           backingSprite->runAction(CCRepeatForever::create( (CCSequence*)CCSequence::create( scaleTo1, scaleTo2, NULL ) ) );
           
        
            
            CCNode * parentNode = backingSprite->getParent();
            if (parentNode) {
                parentNode->reorderChild(backingSprite, backingSprite->getZOrder()-1);
            }
            
            
			
			//createUnitForSprite
        }

		if (nextFigure!=NULL) {
			if( nextFigureSprite == NULL){
                // создаем изображение следующей фигуры
				
				//nextFigureSprite = LHSprite::batchSpriteWithName(figure->getSpriteName(), typesBatch);
				nextFigureSprite = loader->createBatchSpriteWithUniqueName(nextFigure->getSpriteName());
				nextFigureSprite->setScale(0.5);
				nextFigureSprite->setPosition(ccp(
				nextFigureXPosition ,
				winSize.height - nextFigureSprite->boundingBox().size.height/2
				));
                //nextFigureSprite->setZOrder(10);
                
                /// отодвигаем изображение следующей фигуры на слой назад
                CCNode * parentNode = nextFigureSprite->getParent();
                if (parentNode) {
                    parentNode->reorderChild(nextFigureSprite, nextFigureSprite->getZOrder()-1);
                }
			}
            
            /// эффект изменения изображения со следующей фигуры
            CCScaleTo * scale1	= CCScaleTo::create( 0.1, 0.5, 0.5 );
			CCScaleTo * scale2	= CCScaleTo::create( 0.1, 0.6, 0.6 );
			CCScaleTo * scale3	= CCScaleTo::create( 0.1, 0.1, 0.1 );
			//change color
			CCCallFuncND *   funcChangeColorAction = 
                CCCallFuncND::create(this, callfuncND_selector(GameScene::changeColorNextFigure),(void*)nextFigure);


			nextFigureSprite->runAction( CCSequence::create( scale1,scale2,scale3,funcChangeColorAction,NULL ) );
        }
        
    }
    
}


//// callback when we can control position of figure 
void GameScene::figureEndOfPath(CCNode * node)
{
	CCLog("GameScene::figureEndOfPath(CCNode * node)");

    LHSprite* sprite = (LHSprite*) node;
	if( !sprite ) {
		CCLOG( "figureEndOfPath: SPRITE NOT FOUND i" );
		return;
	};
	CFigureUnit * fu = CFigureUnit::unitFromSprite( sprite );
	if( !fu ) {
		CCLOG( "figureEndOfPath: SPRITE NOT FOUND i" );
		return;
	}
            
	//LHSprite* figureSprite = loader->newPhysicalBatchSpriteWithUniqueName(fu->figureTemplate->getSpriteName());

	//LHSprite* figureSprite = LHSprite::batchSpriteWithName(fu->figureTemplate->getSpriteName(),typesBatch);
	LHSprite* figureSprite = LHSprite::batchSpriteWithName(fu->figureTemplate->getSpriteName().c_str(),typesBatch);
    if (figureSprite == NULL) {
		//figureSprite = loader->newPhysicalBatchSpriteWithUniqueName(fu->figureTemplate->getSpriteName_01());
		figureSprite = LHSprite::batchSpriteWithName(fu->figureTemplate->getSpriteName_01(),typesBatch);
    }

	if( !figureSprite ){
		CCLOG("GameScene::figureEndOfPath figureSprite can't create");
	}

	figureSprite->transformPosition( sprite->getPosition() );
	//figureSprite->setPosition( sprite->getPosition() );
	figureSprite->transformRotation( sprite->getRotation() );
	//figureSprite->setRotation( sprite->getRotation() );
	figureSprite->setTag(fu->figureTemplate->tag);
    figureSprite->setColor(fu->figureTemplate->color);
	figureSprite->prepareAnimationNamed(fu->figureTemplate->getAnimWalkName(),"newTypes.pshs");
	figureSprite->playAnimation();
	//figureSprite->startAnimationNamed( fu->figureTemplate->getAnimWalkName());
	currentSprite = figureSprite;
	curTickCount = 0;
    stateFigure = STATE_FIGURE_CONTROL;
	if( currentSprite->getBody() )
		currentSprite->getBody()->SetType(b2_dynamicBody);
	else{
		CCLOG("GameScene::figureEndOfPath currentSprite can't have a body");
	}
	
	
	fu->changeParentSprite( currentSprite );
	
	LHSprite * topSprite = removeTopSpriteFor( sprite );
	//if(topSprite)
		//loader->removeSprite( topSprite );
	sprite->removeSelf();
	//loader->removeSprite( sprite );

	setTopSpriteFor( currentSprite, topSprite );

	fu->animFigure( ANIM_STATE_NORMAL );
	
    /// start of fall status time
    fallStatusStart();

		// make a prizmatic joint
		if(!currentSprite->getBody())
			return;

		b2PrismaticJointDef jointDef;
		b2Vec2 worldAxis(1.0f, 0.0f);
		jointDef.collideConnected = true;
		jointDef.Initialize(currentSprite->getBody(), loader->leftPhysicBoundary(), 
		currentSprite->getBody()->GetWorldCenter(), worldAxis);
		
		prismaticJoint = (b2PrismaticJoint *)world->CreateJoint(&jointDef);
		if(!prismaticJoint){
			CCLOG("GameScene::figureEndOfPath can't create prismaticJoint");
			return;
		}
		/// shockwave
		/*currentSprite->runAction( CCSequence::create(
			CCScaleTo::create( 0.2, 1.1, 0.9 ),
			CCScaleTo::create( 0.2, 0.9, 1.1 ),
			CCScaleTo::create( 0.2, 0.95, 1.05 ),
			CCScaleTo::create( 0.2, 1.02, 0.98 ),
			CCScaleTo::create( 0.2, 1, 1 ),
			NULL
			));
    */
        currentSprite->runAction( Effect::Bubble(0.5, 0.1));

		if( fallingCount > 0 )
		{
			//fallStatusEnd();
			figureMakeDynamic();	
		}
    
    //}
}
	
void GameScene::changeColorNextFigure(CCNode * node, void * data)
{
	CCLog("GameScene::changeColorNextFigure(CCNode * node, void * data)");

	LHSprite * sprite = (LHSprite *)node;
	if( sprite){
		Figure * figure = (Figure*)data;

		CCScaleTo * scale4	= CCScaleTo::create( 0.3, 0.7, 0.7 );
		CCScaleTo * scale5	= CCScaleTo::create( 0.2, 0.4, 0.4 );
		CCScaleTo * scale6	= CCScaleTo::create( 0.1, 0.44, 0.44 );
		CCScaleTo * scale7	= CCScaleTo::create( 0.1, 0.6, 0.6 );
		CCScaleTo * scale8	= CCScaleTo::create( 0.1, 0.5, 0.5 );
        CCCallFuncN * funcPosition = CCCallFuncN::create(this, callfuncN_selector(GameScene::changePositionNextFigure));
        

		sprite->setColor( figure->color );
		sprite->prepareAnimationNamed(figure->getAnimWalkName(), "newTypes.pshs" );
		sprite->playAnimation();
		//sprite->startAnimationNamed( figure->getAnimWalkName() );
		sprite->runAction( CCSequence::create( 
				scale4,scale5,scale6,scale7,scale8,funcPosition,NULL
				) );
	}
}

void GameScene::changePositionNextFigure(CCNode * node)
{
	CCLog("GameScene::changePositionNextFigure(CCNode * node)");

	LHSprite * sprite = (LHSprite *)node;
	if( sprite){
        CCMoveTo * moveTo = CCMoveTo::create(
                                                     0.2, 
                                                     ccp( 
                                                         nextFigureXPosition, 
                                                         winSize.height - sprite->boundingBox().size.height/2
                                                         ) 
                                                     );
		sprite->runAction( moveTo );
        
    }

}

void GameScene::endPulse(CCNode * node)
{
	CCLog("GameScene::endPulse(CCNode * node)");
    LHSprite * sprite = (LHSprite *)node;
    if (sprite) {
        CFigureUnit * unit = CFigureUnit::unitFromSprite(sprite);
        if (unit) {
            unit->isPulsing = false;
        }
    }
}


int GameScene::checkCombo( CCPoint pos )
{
	CCLog("GameScene::checkCombo( CCPoint pos )");

    comboCount++;
    comboTime = COMBO_TIME ;

    if (comboCount >= 2) {
        LHSprite * comboSprite = NULL;
        
        switch (comboCount) {

            case 2:
                //combo 2x
                scoreHitAtPosition(pos, 10);
                levelLayer->stopAllActions();
                levelLayer->runAction(Effect::ShakeWorld1());
                comboSprite = loader->createBatchSpriteWithUniqueName("combo2x");
                
                CCLOG("GameScene::checkCombo combo 2x");
                break;
            case 3:
                //combo 3x
                scoreHitAtPosition(pos, 11);
                levelLayer->stopAllActions();
                levelLayer->runAction(Effect::ShakeWorld2());
                comboSprite = loader->createBatchSpriteWithUniqueName("combo3x");
                
                
                CCLOG("GameScene::checkCombo combo 3x");
                
                
                break;
            case 4:
                //super
                scoreHitAtPosition(pos, 12);
                levelLayer->stopAllActions();
                levelLayer->runAction(Effect::ShakeWorld3());
                comboSprite = loader->createBatchSpriteWithUniqueName("superCombo");
                
                CCLOG("GameScene::checkCombo combo 4x");
                break;
                
            case 5:
                /// mega combo
                scoreHitAtPosition(pos, 13);
                levelLayer->stopAllActions();
                levelLayer->runAction(Effect::ShakeWorld4());
                comboSprite = loader->createBatchSpriteWithUniqueName("megaCombo");
                
                CCLOG("GameScene::checkCombo MEGA combo");
                break;
            default:
                /// cosmo combo
                scoreHitAtPosition(pos, 14);
                levelLayer->stopAllActions();
                levelLayer->runAction(Effect::ShakeWorld4());                
                comboSprite = loader->createBatchSpriteWithUniqueName("cosmoCombo");
                
                CCLOG("GameScene::checkCombo MEGA combo");
                break;

        }
        
        if (comboSprite) {
            CCScaleTo * scale1 = CCScaleTo::create(0.2, 1.0 );
            CCMoveBy * move1 = CCMoveBy ::create(1, ccp(0,0) );      
            CCMoveBy * move2 = CCMoveBy ::create(1, ccp(0,30) );
            
            CCMoveBy * move3 = CCMoveBy ::create(1, ccp(0,0) );      
            CCFadeTo * fade1 = CCFadeTo ::create(1, 0 );
            CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(GameScene::removeScoreText));
            
            comboSprite->setPosition(comboPoint);
            comboSprite->setScale(2.0);
            comboSprite->runAction(CCSequence::create(scale1,move1,move2,funcAction,NULL));
            comboSprite->runAction(CCSequence::create(move3,fade1,NULL));         
            
            
            
        }
        
/*        CCLabelTTF *curScore = CCLabelTTF::labelWithString(comboLabel.c_str(), FLOAT_POINTS_FONT,fontSizeEx);
        curScore->setColor(color);
        curScore->setPosition(pos);
        addChild(curScore,20);
  */      
		/*CCScaleTo * scale1	= CCScaleTo::create( 0.2, 0.7, 0.7 );
		CCScaleTo * scale2	= CCScaleTo::create( 0.2, 1.3, 1.3 );
		CCScaleTo * scale3	= CCScaleTo::create( 0.2, 0.9, 0.9 );
		CCScaleTo * scale4	= CCScaleTo::create( 0.2, 1.1, 1.1 );
		CCScaleTo * scale5	= CCScaleTo::create( 0.7, 1, 1 );
        */
		//
       // CCFadeTo *      fadeAction      = CCFadeTo::create(1.5, 0 );
        
		//CCMoveBy *		moveAction		= CCMoveBy::create( 2, ccp( 0, 30 ));
		
        
        //CSequence::create( )
        //CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(GameScene::removeScoreText));
        //curScore->runAction(CCSequence::actionOneTwo(fadeAction, funcAction));
		/*curScore->runAction(fadeAction);
		curScore->runAction(CCSequence::create( moveAction,funcAction,NULL ) );
		curScore->runAction(CCSequence::create(scale1,scale2,scale3,scale4,scale5 ,NULL));
         */
        
        


    }else{
        levelLayer->stopAllActions();
        levelLayer->runAction(Effect::ShakeWorld0());
    }

	return comboCount;
}

void GameScene::spriteAnimHasEnded(CCObject * object)
{
	CCLog("GameScene::spriteAnimHasEnded(CCObject * object)");

    LHSprite *      spr             = (LHSprite*) object;
    if (!spr) {
        return;
    }
    
    std::string     animationName   = spr->animationName();
	if(!spr) return;

    if (spr->getTag() == DELETING_SPRITE) {
		spr->removeSelf();
        return;
    }
    CFigureUnit * fu = CFigureUnit::unitFromSprite( spr );
	if(!fu) return;

	if( animationName == fu->figureTemplate->getAnimBlinkName()  )
	{
		fu->genNewTimeToNextBlink();
		fu->animFigure( ANIM_STATE_NORMAL );
	}
    //CCLog("Animation with name %s has ended on sprite with name %s", animationName.c_str(), spr->getUniqueName().c_str());
}


/// vfrt figure dynamic for it fall down physicly
void GameScene::figureMakeDynamic( bool needCreateNew)
{
	CCLog("GameScene::figureMakeDynamic( bool needCreateNew)");
    
    if (currentSprite!=NULL) {
        //currentSprite->getBody()->SetType(b2_dynamicBody);
		if(currentSprite->getBody())
			currentSprite->getBody()->SetLinearVelocity(b2Vec2(0,0));
		else{
			CCLOG( "GameScene::figureMakeDynamic sprite %s haven't body",currentSprite->getUniqueName().c_str() );
		}
        
        fallStatusEnd();

        CFigureUnit::addSprite(currentSprite);
		
		if(prismaticJoint){
			CCLOG( "GameScene::figureMakeDynamic >DestroyJoint(prismaticJoint);" );
			world->DestroyJoint(prismaticJoint);
			prismaticJoint = NULL;
		}else{
			CCLOG( "GameScene::figureMakeDynamic prismaticJoint = NULL" );
		}
		
		if (mouseJoint) {
			CCLOG( "GameScene::figureMakeDynamic >DestroyJoint(mouseJoint);" );
			world->DestroyJoint(mouseJoint);	
			mouseJoint = NULL;
		}else{
			CCLOG( "GameScene::figureMakeDynamic mouseJoint = NULL" );
		}
    }
    ///create next figure
	if( isGameOver )
		return;

	if(fallingSprite){
	}
    /// задаем падающую фигуру
    fallingSprite = currentSprite;
    
	if( needCreateNew && fallingCount == 0 ){

		figureCreateNew();
	}
}


//------------------------------
// MENU AND GAME STATE
//------------------------------
//- перезапуск уровня
void GameScene::restartGame(CCObject* pSender)
{

	CCLog("GameScene::restartGame");

    unscheduleAllSelectors();
    CCDirector::sharedDirector()->replaceScene(GameScene::scene());
}

// смерть игрока
void GameScene::gameOver()
{
	CCLog("GameScene::gameOver()");
	isGameOver = true;
    /// redirect to menu
}

void GameScene::createMouseJoint(b2Vec2 locationWorld)
{
	CCLOG("GameScene::createMouseJoint");

	b2MouseJointDef md;
	if(!currentSprite){
		CCLOG("GameScene::createMouseJoint NO SPRITE ");
		return;
	}

	if(!currentSprite->getBody()){
		CCLOG("GameScene::createMouseJoint NO BODY FOR SPRITE %s", currentSprite->getUniqueName().c_str());
		return;
	}

	md.bodyA = loader->leftPhysicBoundary();
	md.bodyB = currentSprite->getBody();
	//currentSprite->getBody()->SetType(b2_dynamicBody);
	md.target = locationWorld;
	md.collideConnected = true;
	md.maxForce = 400.0f * currentSprite->getBody()->GetMass();
	mouseJoint = (b2MouseJoint *)world->CreateJoint(&md);
	currentSprite->getBody()->SetAwake(true);

}
////score points

///--------------------------------------
void GameScene::scoreHit(int points)
{
	CCLog("GameScene::scoreHit(int points)");
	
    score += points;
    LevelLoader::getInstance()->addPoints( points );
    scoreUpdate();
}

///--------------------------------------
void GameScene::scoreHitAtPosition(CCPoint position, int points)
{    
	CCLog("GameScene::scoreHitAtPosition(CCPoint position, int points)");

    int realPoints = points;
    int fontSize = fontSizeFloatScore;
    ccColor3B color = FLOAT_POINTS_COLOR;
    int levelNumber = 1;
    if( LevelLoader::getInstance() ){
        levelNumber = LevelLoader::getInstance()->curStageNumber;
    }
    
	if( points < 49 ){
		if( points < MIN_COLLIDED_CLEAR ){
			realPoints = 5 * multiplier;// 20;
		}else if( points == MIN_COLLIDED_CLEAR ){
			realPoints = 10 * multiplier; //30;
		}else if( points == MIN_COLLIDED_CLEAR + 1){
            fontSize    = fontSizeFloatScore * 1.1;
            color       = FLOAT_POINTS_COLOR1;
			realPoints = 15 * multiplier; //50;
		}else if( points == MIN_COLLIDED_CLEAR + 2){
			realPoints = 20 * multiplier;//;
            fontSize    = fontSizeFloatScore * 1.2;
            color       = FLOAT_POINTS_COLOR2;
            
		}else if( (points == MIN_COLLIDED_CLEAR + 3) && points < 10 ){
			realPoints = 30 * multiplier;
            fontSize    = fontSizeFloatScore * 1.3;
            color       = FLOAT_POINTS_COLOR3;
            
		}else if (points == 10) { //combo2x
            
                
            realPoints = 500 * levelNumber;
            fontSize    = fontSizeFloatScore * 2;
            color       = FLOAT_POINTS_COLOR1;

        }else if (points == 11) { //combo2x
            realPoints = 1000 * levelNumber;
            fontSize    = fontSizeFloatScore * 2.2;
            color       = FLOAT_POINTS_COLOR1;
            
        }else if (points == 12) { //combo2x
            realPoints = 2000 * levelNumber;
            fontSize    = fontSizeFloatScore * 2.4;
            color       = FLOAT_POINTS_COLOR1;
            
        }else if (points == 13) { //combo2x
            realPoints = 5000 * levelNumber;
            fontSize    = fontSizeFloatScore * 3;
            color       = FLOAT_POINTS_COLOR1;
            
        }else if (points == 14) { //combo2x
            realPoints = 10000 * levelNumber;
            fontSize    = fontSizeFloatScore * 3;
            color       = FLOAT_POINTS_COLOR1;
            
        }
        
	}
	
	
	
	score += realPoints;
    
    LevelLoader::getInstance()->addPoints( realPoints );
    
    
//    char curScoreTxt[40]; 
//    sprintf(curScoreTxt, " %d",score );
    scoreUpdate();

    if(position.x!=0 && position.y!=0) {

        scoreFlyCreate(position, realPoints);
        /*
        sprintf(curScoreTxt, "+ %d", realPoints );
        CCLabelTTF *curScore = CCLabelTTF::labelWithString(curScoreTxt, FLOAT_POINTS_FONT,fontSize);
        curScore->setColor(color);
        curScore->setPosition(position);
        addChild(curScore,20);
        
		CCScaleTo * scale1	= CCScaleTo::create( 0.2, 0.7, 0.7 );
		CCScaleTo * scale2	= CCScaleTo::create( 0.2, 1.3, 1.3 );
		CCScaleTo * scale3	= CCScaleTo::create( 0.2, 0.9, 0.9 );
		CCScaleTo * scale4	= CCScaleTo::create( 0.2, 1.1, 1.1 );
		CCScaleTo * scale5	= CCScaleTo::create( 0.7, 1, 1 );

		//
        CCFadeTo *      fadeAction      = CCFadeTo::create(1.5, 0 );

		CCMoveBy *		moveAction		= CCMoveBy::create( 2, ccp( 0, 30 ));
		

	//CSequence::create( )
        CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(GameScene::removeScoreText));
        //curScore->runAction(CCSequence::actionOneTwo(fadeAction, funcAction));
		curScore->runAction(fadeAction);
		curScore->runAction(CCSequence::create( moveAction,funcAction,NULL ) );
		curScore->runAction(CCSequence::create(scale1,scale2,scale3,scale4,scale5 ,NULL));
         */
		
    }
    
    
}
///--------------------------------------
void GameScene::removeScoreText(CCNode * node)
{
	CCLOG("GameScene::removeScoreText: remove node %i", node->getTag());

    LHSprite * sprite = (LHSprite *) node;
    if (sprite) {
		CCLOG("GameScene::removeScoreText: remove sprite %s", sprite->getUniqueName().c_str());
		sprite->removeSelf();
		sprite = NULL;
    }
/*	CCLabelTTF * scoreFlyLabel = (CCLabelTTF *) node;
    if( scoreFlyLabel ){
        scoreFlyLabel->removeFromParentAndCleanup(true);
    }*/
}


///----------------------------------------
// CONTROL 
//-----------------------------------------
/// управление нажатием
void GameScene::ccTouchesBegan(cocos2d::CCSet* touches, cocos2d::CCEvent* event)
{

	if( isGameOver )
		return;

    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );
            BonusItem * item = BonusItem::checkTouch(location);
            if ( item != NULL) {
                item->useBonus(location);
                return;
            }
			

			// new control
			b2Vec2 locationWorld = LevelHelperLoader::pointsToMeters( location ); //b2Vec2(location.x/PTM_RATIO, location.y/PTM_RATIO);
			
			if( currentSprite==NULL ) return;
			if( currentSprite->getBody() == NULL ) return;
			locationWorld.y =  currentSprite->getBody()->GetPosition().y;

			//// save fast fall action
            if ((currentSprite!=NULL) && (stateFigure == STATE_FIGURE_CONTROL)) {
                fastFallDown = true;
                fastFallDownCounter = 0;
                touchFastFallDown = touch;
            }

			/// if control has already, go out
			if (mouseJoint != NULL) return;
			
			if (stateFigure != STATE_FIGURE_CONTROL)
				return;

			if (touchMoveRotate == NULL) {
                touchMoveRotate = touch;
                prevMovePosition = location;
            }


			createMouseJoint(locationWorld);


			// end of new control


			/*
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
			*/
        }
    }

}


//// control
void GameScene::ccTouchesMoved(cocos2d::CCSet* touches, cocos2d::CCEvent* event)
{
	if( isGameOver )
		return;
        
		CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
                            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );
//                CCPoint location= CCDirector::sharedDirector()->convertToGL(
//                                                                            touch->locationInView(touch->view())
//                                                                            );
				b2Vec2 locationWorld = LevelHelperLoader::pointsToMeters( location ); 
				if( currentSprite==NULL ) return;
				if( currentSprite->getBody() == NULL ) return;
				locationWorld.y =  currentSprite->getBody()->GetPosition().y;

                if (touchFastFallDown == touch) {
                    fastFallDown        = false;
                    fastFallDownCounter = 0;
                    touchFastFallDown   = NULL;
                }

                
				if (mouseJoint == NULL) {
					if(stateFigure == STATE_FIGURE_CONTROL){
						createMouseJoint(locationWorld);
					}else{
						return;
					}
				}
				
				mouseJoint->SetTarget(locationWorld);
                


                //currentSprite->transformRotation( 100 );

                /*if ((currentSprite!=NULL) && (stateFigure == STATE_FIGURE_CONTROL)) {
                    if (touch == touchMoveRotate) {
                        float deltaY = prevMovePosition.y - location.y;                        
                         deltaY = (winSize.height/200)*deltaY;
                        CCLog("Ang velosity: %f",deltaY);
                        if (abs(deltaY)>1) {
                            currentSprite->transformRotation( deltaY );
                        }
                        
                        
                        
                        prevMovePosition = location;       
                    }
                    
                }*/

				
				/*
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
								//currentSprite->getBody()->Set
                            }
                        }


                        prevMovePosition = location;
                    }
                }
			*/
            }
        }
}


void GameScene::ccTouchesEnded(CCSet* touches, CCEvent* event)
{
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );

            if (touchFastFallDown == touch ) {
                if (fastFallDown) {
                    figureMakeDynamic();
                }
                fastFallDown        = false;
                fastFallDownCounter = 0;
                touchFastFallDown   = NULL;
            }

			if (mouseJoint) {
				world->DestroyJoint(mouseJoint);
				mouseJoint = NULL;
			}

			if(stateFigure == STATE_FIGURE_CONTROL){
				if(currentSprite){
					if(currentSprite->getBody())
						currentSprite->getBody()->SetLinearVelocity(b2Vec2(0,0));
				}
			}

            if ( touchMoveRotate == touch)  
                touchMoveRotate = NULL;
            
        }
    }
}

void GameScene::ccTouchesCancelled(cocos2d::CCSet* touches, cocos2d::CCEvent* event)
{
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );


			if (mouseJoint) {
				world->DestroyJoint(mouseJoint);
				//currentSprite->getBody()->SetType(b2_staticBody);
				mouseJoint = NULL;
			}

            if (touchFastFallDown == touch ) {
                if (fastFallDown) {
                    figureMakeDynamic();
                }
                fastFallDown        = false;
                fastFallDownCounter = 0;
                touchFastFallDown   = NULL;
            }
            
            if ( touchMoveRotate == touch)  
                touchMoveRotate = NULL;
            
        }
    }
}

void GameScene::setTopSpriteFor( LHSprite * parent, LHSprite * topSprite )
{
	CCLog("GameScene::setTopSpriteFor( LHSprite * parent, LHSprite * topSprite )");

	map<LHSprite *, LHSprite *>::iterator It = topSprites.find( parent );
	if( It != topSprites.end() ){
		It->second = topSprite;
	}else{
		topSprites.insert( make_pair( parent, topSprite ));
	}
    CCLOG("set TOP SPRITE %s for sprite %s ", topSprite->getUniqueName().c_str(),parent->getUniqueName().c_str() );
}

LHSprite * GameScene::removeTopSpriteFor( LHSprite * parent )
{
	CCLog("GameScene::removeTopSpriteFor( LHSprite * parent )");

	map<LHSprite *, LHSprite *>::iterator It = topSprites.find( parent );
	LHSprite * topSprite = NULL;
	if( It != topSprites.end() ){
		topSprite = It->second;
		topSprites.erase( It );
        CCLOG("remove TOP SPRITE %s for sprite %s ", topSprite->getUniqueName().c_str(),parent->getUniqueName().c_str() );        
		return topSprite;
	}
	return NULL;
}

LHSprite * GameScene::getTopSpriteFor( LHSprite * parent )
{
	CCLog("GameScene::getTopSpriteFor( LHSprite * parent )");

	map<LHSprite *, LHSprite *>::iterator It = topSprites.find( parent );
	LHSprite * topSprite = NULL;
	if( It != topSprites.end() ){
		topSprite = It->second;
		return topSprite;
	}
	return NULL;
}

void GameScene::updateTopSprites( void )
{
	CCLog("GameScene::updateTopSprites( void )");

	map<LHSprite *, LHSprite *>::iterator It = topSprites.begin();
	for( ; It!=topSprites.end(); It++){
		LHSprite * parentSprite = It->first;
		LHSprite * topSprite = It->second;
		if( (parentSprite != NULL) && (topSprite != NULL) ){
			topSprite->setPosition( parentSprite->getPosition() );
			topSprite->setRotation( parentSprite->getRotation() );
			topSprite->setScaleX( parentSprite->getScaleX() );
			topSprite->setScaleY( parentSprite->getScaleY() );
			
		}
	}
}

LHSprite * GameScene::createTopSpriteFor( LHSprite * parent )
{
	CCLog("GameScene::createTopSpriteFor( LHSprite * parent )");

	if( !parent ) return NULL;
	CFigureUnit * fu = CFigureUnit::unitFromSprite( parent );
	if( !fu ) return NULL;
	LHSprite * topSprite = loader->createBatchSpriteWithUniqueName(fu->figureTemplate->getSpriteName());
    if (topSprite == NULL) {
         topSprite = loader->createBatchSpriteWithUniqueName(fu->figureTemplate->getSpriteName_01());
    }
	if(!topSprite) return NULL;

	CCNode * parentNode = topSprite->getParent();
    if (parentNode) {
		parentNode->reorderChild(topSprite, topSprite->getZOrder()+1);
    }
	topSprite->prepareAnimationNamed(fu->figureTemplate->getAnimEyeWalk(), "newTypes.pshs");
	topSprite->playAnimation();
	//topSprite->startAnimationNamed( fu->figureTemplate->getAnimEyeWalk() );

	setTopSpriteFor( parent, topSprite );
	return topSprite;
}

void GameScene::removeAllTopSprites()
{
	CCLog("GameScene::removeAllTopSprites()");

    map<LHSprite *, LHSprite *>::iterator It = topSprites.begin();
	for( ; It!=topSprites.end(); It++){
		LHSprite * parentSprite = It->first;
		LHSprite * topSprite = It->second;
		if( (parentSprite != NULL) && (topSprite != NULL) ){
			parentSprite->removeSelf();
			parentSprite = NULL;
			topSprite->removeSelf();
			topSprite = NULL;
		}
	}
    topSprites.clear();

    
}


CCRect GameScene::boundBoxFromSprite(LHSprite * sprite)
{
	CCLog("GameScene::boundBoxFromSprite(LHSprite * sprite)");
    
    CCRect rect;
    b2AABB aabb;
    
	if( !sprite ) return rect;
    if( !sprite->getBody() ) return rect;
    
    aabb.lowerBound = b2Vec2(FLT_MAX,FLT_MAX);
    aabb.upperBound = b2Vec2(-FLT_MAX,-FLT_MAX); 
    b2Fixture* fixture = sprite->getBody()->GetFixtureList();
    while (fixture != NULL)
    {
        //b2Shape* shape = fixture->GetShape();
        
        
        aabb.Combine(aabb, fixture->GetAABB(0));
        fixture = fixture->GetNext();
    }
    
    CCPoint low = LevelHelperLoader::metersToPoints(aabb.lowerBound);
    CCPoint hi = LevelHelperLoader::metersToPoints(aabb.upperBound);

    rect.origin = low;
    rect.size.width =  hi.x - low.x;
    rect.size.height = hi.y - low.y;
    return rect;
}

void GameScene::preNewStage()
{
	CCLog("GameScene::preNewStage()");

    int stars = LevelLoader::getInstance()->getStars();
    int additionalPoints = 0;
    LHSprite * achiveSprite = NULL;
    //Stage * stage = LevelLoader::getInstance()->getCurStage();
    switch (stars) {
        case 1:
            additionalPoints = LevelLoader::getInstance()->curStageNumber * 500;            
            break;
        case 2:
            additionalPoints = LevelLoader::getInstance()->curStageNumber * 5000;
            achiveSprite = loader->createBatchSpriteWithUniqueName("excellent");
            break;
        case 3:
            additionalPoints = LevelLoader::getInstance()->curStageNumber * 10000;
            achiveSprite = loader->createBatchSpriteWithUniqueName("perfect");
            break;
            
        default:
            break;
    }
    
    if (achiveSprite) {
        achiveSprite->setPosition(levelAchivePoint);
        achiveSprite->setScale(2);

        
        
        CCScaleTo * scale1 = CCScaleTo::create(0.2, 1.0 );
        CCMoveBy * move1 = CCMoveBy ::create(1, ccp(0,0) );      
        CCMoveBy * move2 = CCMoveBy ::create(1, ccp(0,-30) );
        
        CCMoveBy * move3 = CCMoveBy ::create(1, ccp(0,0) );      
        CCFadeTo * fade1 = CCFadeTo ::create(1, 0 );
        CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(GameScene::removeScoreText));
        
        //achiveSprite->setPosition(comboPoint);
        achiveSprite->setScale(2.0);
        achiveSprite->runAction(CCSequence::create(scale1,move1,move2,funcAction,NULL));
        achiveSprite->runAction(CCSequence::create(move3,fade1,NULL));         
        
    }
    
    LHSprite * nextLevelSprite = loader->createBatchSpriteWithUniqueName("nextLevel");
    if (nextLevelSprite) {
        nextLevelSprite->setPosition(nextLevelPoint);
        nextLevelSprite->setScale(0.2);
        CCScaleTo * scale1 = CCScaleTo::create(0.2, 1.0 );
        CCMoveBy * move1 = CCMoveBy ::create(1.5, ccp(0,0) );      
        CCScaleTo * scale2 = CCScaleTo::create(1, 2.0 );
        
        CCMoveBy * move3 = CCMoveBy ::create(1.5, ccp(0,0) );      
        CCFadeTo * fade1 = CCFadeTo ::create(1, 0 );
        CCCallFuncN *   funcAction      = CCCallFuncN::create(this, callfuncN_selector(GameScene::removeScoreText));
        
        //nextLevelSprite->setPosition(comboPoint);
        nextLevelSprite->setScale(2.0);
        nextLevelSprite->runAction(CCSequence::create(scale1,move1,scale2,funcAction,NULL));
        nextLevelSprite->runAction(CCSequence::create(move3,fade1,NULL));         
    }
    
    scoreHitAtPosition(additionalPoint, additionalPoints);
    
    
}

void GameScene::afterNewStage()
{
	CCLog("GameScene::afterNewStage()");
    levelLabelUpdate();
}


void GameScene::fallStatusStart()
{
	CCLog("GameScene::fallStatusStart()");
    if (!fallStatus) {
        fallStatus = loader->createBatchSpriteWithUniqueName("fallStatus0001");
        fallStatus->setOpacity(200);
    }
    if (!fallStatus) {
        return;
    }
	fallStatus->prepareAnimationNamed("statusEmpty","status.pshs");
	fallStatus->playAnimation();

    //fallStatus->startAnimationNamed("statusEmpty");

    if (currentSprite) {
        if (stateFigure == STATE_FIGURE_CONTROL) {
            CCRect figureRect   = currentSprite->boundingBox();
            CCPoint figurePos         = currentSprite->getPosition();
            figurePos.y = figureRect.origin.y + figureRect.size.height + fallStatus->boundingBox().size.height/2 + 2;
            fallStatus->setPosition( figurePos );
			fallStatus->prepareAnimationNamed("status90","status.pshs");
			fallStatus->playAnimation();
        }
    }
    

    
}

void GameScene::fallStatusEnd()
{
	CCLog("GameScene::fallStatusEnd()");
    if (!fallStatus) {
        return;
    }
    
    //fallStatus->startAnimationNamed("statusEmpty");
	fallStatus->prepareAnimationNamed("statusEmpty","status.pshs");
	fallStatus->playAnimation();

    
}

void GameScene::fallStatusUpdate(float percent)
{
	CCLog("GameScene::fallStatusUpdate(float percent)");

    if (!fallStatus) {
        return;
    }
    static string lastAnimation = "";
    string animationName = "statusEmpty";
    
    if (currentSprite) {
        if (stateFigure == STATE_FIGURE_CONTROL) {
            CCRect figureRect   = currentSprite->boundingBox();
            CCPoint figurePos         = currentSprite->getPosition();
            figurePos.y = figureRect.origin.y + figureRect.size.height + fallStatus->boundingBox().size.height/2 + 2;
            fallStatus->setPosition( figurePos );
            
            if (percent >= 95) { animationName = "status95"; } else 
            if (percent >= 90) { animationName = "status90"; } else 
            if (percent >= 85) { animationName = "status85"; } else 
            if (percent >= 80) { animationName = "status80"; } else 
            if (percent >= 75) { animationName = "status75"; } else 
            if (percent >= 70) { animationName = "status70"; } else 
            if (percent >= 65) { animationName = "status65"; } else           
            if (percent >= 60) { animationName = "status60"; } else           
            if (percent >= 55) { animationName = "status55"; } else                 
            if (percent >= 50) { animationName = "status50"; } else 
            if (percent >= 45) { animationName = "status45"; } else                 
            if (percent >= 40) { animationName = "status40"; } else 
            if (percent >= 35) { animationName = "status35"; } else 
            if (percent >= 30) { animationName = "status30"; } else 
            if (percent >= 25) { animationName = "status25"; } else 
            if (percent >= 20) { animationName = "status20"; } else 
            if (percent >= 15) { animationName = "status15"; } else 
            if (percent >= 10) { animationName = "status10"; } else 
            if (percent >= 5) { animationName = "status5"; } else 
            { animationName = "status0"; }
                
                
            if (lastAnimation != animationName) {
				fallStatus->prepareAnimationNamed(animationName,"status.pshs");
				fallStatus->playAnimation();

                CCLOG( "GameScene::fallStatusUpdate start animation: %s ", animationName.c_str() );
            }
            
        }
    }
    
    lastAnimation = animationName;
}

void GameScene::fallRandomFigures()
{
	CCLog("GameScene::fallRandomFigures()");

	int rndCount = respawnPoints.size() - 4;
	int fallCount = CCRANDOM_0_1() * 3 + rndCount;
	if( (fallCount > 0) && (fallCount < respawnPoints.size()) ){
		/// fall of random figures
		vector<int> indeces;
		for(int i=0; i < respawnPoints.size(); i++){
			indeces.push_back( i );
		}

		Stage * stage = LevelLoader::getInstance()->getCurStage();
		int index = 0;
		int pntIndex = 0;
		if(stage){
			for(int i=0; i < fallCount; i++ ){
				Figure * figure = stage->randomFigure();
				index = CCRANDOM_0_1() * indeces.size();
				if((index > 0) && (index < indeces.size())){
					pntIndex = indeces[index];
					indeces.erase( indeces.begin() + index );
				}
				/// create figure this

                //LHSprite* figureSprite = loader->newPhysicalBatchSpriteWithUniqueName(figure->getSpriteName());
				//LHSprite* figureSprite = LHSprite::batchSpriteWithName(figure->getSpriteName(), typesBatch);
				LHSprite* figureSprite = LHSprite::batchSpriteWithName(figure->getSpriteName(), typesBatch);
                if (figureSprite == NULL) {
					figureSprite = LHSprite::batchSpriteWithName(figure->getSpriteName_01(), typesBatch);
                }
                
                if( !figureSprite ){
                    CCLOG("GameScene::figureEndOfPath figureSprite can't create");
                }
                float angle = stage->rotationAngle * 2;
                
				float rndFigureAngle = CCRANDOM_0_1() * angle - (angle / 2);

                
                figureSprite->transformPosition( respawnPoints[pntIndex] );
                figureSprite->transformRotation( rndFigureAngle );
                figureSprite->setTag(figure->tag);
                figureSprite->setColor(figure->color);
				figureSprite->prepareAnimationNamed(figure->getAnimWalkName(), "newTypes.pshs");
				figureSprite->playAnimation();
                //figureSprite->startAnimationNamed( figure->getAnimWalkName());
                if( figureSprite->getBody() )
                    figureSprite->getBody()->SetType(b2_dynamicBody);
                CFigureUnit * fu = CFigureUnit::createUnitForSprite( figureSprite, figure );

                //setTopSpriteFor( currentSprite, topSprite );
                createTopSpriteFor( figureSprite );
                fu->animFigure( ANIM_STATE_NORMAL );      

                CFigureUnit::addSprite(figureSprite);
                

                
                
                
//                fu->changeParentSprite( currentSprite );
                
//                LHSprite * topSprite = removeTopSpriteFor( sprite );
                //if(topSprite)
                //loader->removeSprite( topSprite );
                
//                loader->removeSprite( sprite );
                
                                
                
                


			}///for
            
			
            
			//fallingCount++;

			//if( stateFigure == STATE_FIGURE_CONTROL)
				//figureMakeDynamic( false );

            /*runAction(CCSequence::create( 
                                          CCDelayTime::create(3), 
                                          CCCallFuncN::create(this, callfuncN_selector(GameScene::fallOfFigureEnd)),
                                          NULL));
								*/		  
			
            

		}
	}

}

void GameScene::fallOfFigureEnd(CCNode * node){
    CCLOG("GameScene::fallOfFigureEnd");
	fallingCount--;
	if(fallingCount == 0){

		figureCreateNew();
	}
}


void GameScene::touchBeginOnSprite(CCObject* cinfo)
{
	CCLog("GameScene::touchBeginOnSprite(CCObject* cinfo)");

    LHTouchInfo* info = (LHTouchInfo*)cinfo;
    LHSprite * sp = info->sprite;
    if (sp) {
        if (sp->getUniqueName() == "megabomb") {

            destroyGameData();
            initNewGame();
        }
    }

}
void GameScene::touchMovedOnSprite(CCObject* cinfo)
{
    
}
void GameScene::touchEndedOnSprite(CCObject* cinfo)
{
    
}

