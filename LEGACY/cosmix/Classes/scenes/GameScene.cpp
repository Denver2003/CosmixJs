#include "GameScene.h"
#include "MainMenuScene.h"
#include "SimpleAudioEngine.h"
#include "Bonus.h"
#include "Effect.h"
#include "quest.h"
#include "QuestItem.h"
#include "params.h"
#include "sounds.h"

#include "Game.h"
#include "AliensManager.h"
#include "TaskManager.h"
#include "PlayEvents.h"
#include "FlyTask.h"
#include "DuringTime.h"
#include "CosmoMeter.h"
#include "UserRating.h"
#include "CosmoBonuses.h"
#include "shop.h"
#include "Test.h"

/// debug
//#include "b2DebugDraw.h"

using namespace cocos2d;
using namespace CocosDenshion;

GameScene * GameScene::gameScene = NULL;

GameScene::GameScene()
{
    //init scene
    
    params::getInstance()->loadAll();           /// we load all params from storage
	TESTLOG("GameScene::GameScene()");
	GameScene::gameScene	= this;             ///save instance of scene
	world					= NULL;				///physics world
	// we get size of screen
	winSize             = CCDirector::sharedDirector()->getWinSize();
    // we enable the touch
	setTouchEnabled( true );
	// set up accelerometer
	setAccelerometerEnabled( true );
	// step of shock 
	stepOfShock				= winSize.height * 0.05;
	stepOfFallingFigure		= winSize.height * 0.001;
    fallStatus              = NULL;
    levelStatus             = NULL;
	fallingCount			= 0;
    aimLeft                 = NULL;
    aimRight                = NULL;
    laser					= NULL;
    moon                    = NULL;
    infoScore               = NULL;
    infoLevel               = NULL;
    infoCoins               = NULL;
    

	world = Game::getWorld();
	

	addChild(Game::getGameLayer(), 1);
    addChild(Game::getSubMenuLayer(), 2);
    addChild(Game::getMenuLayer(), 3);
    addChild(Game::getShopLayer(), 5);
    

////////////////// LEVEL HELPER INIT HERE //////////////////////////////    
	loader = Game::getLoader();
    
    
    camPntPlay = new CameraPoint();
    camPntPlay->setDirect("play", getPosition());
    
    camPntMainMenu = new CameraPoint( "mainMenu",camPntPlay);
    
    // кнопки инициализация
    playButton  = new Button("", "play", "ui.pshs",
                             this, callfuncO_selector(GameScene::buttonPlayAction));
    playButton->setPressType(PRESSTYPE_ON_UP_DIRECT);
    shopButton  = new Button("", "shop", "ui.pshs",
                             this, callfuncO_selector(GameScene::buttonShopAction));
    shopButton->setPressType(PRESSTYPE_ON_UP_DIRECT);

    
    pauseButton  = new Button("icon_level", "pause", "labels.pshs",
                             this, callfuncO_selector(GameScene::buttonPauseAction));
    pauseButton->setPressType(PRESSTYPE_ON_DOWN);
    
    // меню паузы инициализация
    pauseMenu = new PopupMenu("menu_pause.plhs");
    
    pauseMenu->setOnShowFunc(this, callfuncO_selector(GameScene::onShowPauseMenu));
    
    buttonResume = pauseMenu->getButtonByName("resume");
    if (buttonResume) {
        buttonResume->setActionFunction(this,callfuncO_selector(GameScene::buttonResumeAction) );
    }
    
    buttonReply = pauseMenu->getButtonByName("reply");
    if (buttonReply) {
        buttonReply->setActionFunction(this,callfuncO_selector(GameScene::buttonRestartActionWithRating) );
    }
    
    buttonSound = pauseMenu->getButtonByName("sound");
    if (buttonSound) {
        buttonSound->setActionFunction(this,callfuncO_selector(GameScene::buttonChangeSound) );
        buttonSound->setType(BUTTONTYPE_CHECK);
        buttonSound->setChecked(params::getInstance()->soundOn == 1 ? false : true );
    }

    buttonMusic = pauseMenu->getButtonByName("music");
    if (buttonMusic) {
        buttonMusic->setActionFunction(this,callfuncO_selector(GameScene::buttonChangeMusic) );
        buttonMusic->setType(BUTTONTYPE_CHECK);
        buttonMusic->setChecked(params::getInstance()->musicOn == 1 ? false : true );
    }

    buttonShop = pauseMenu->getButtonByName("shopb");
    if (buttonShop) {
        buttonShop->setActionFunction(this,callfuncO_selector(GameScene::onShowShop) );
    }
    

    // инициализация всплывающего меню Конец игры
    gameoverMenu = new PopupMenu("menu_gameover.plhs");
    gameoverMenu->setOnShowFunc(this, callfuncO_selector(GameScene::onShowGameoverMenu));
    
    buttonReply2 = gameoverMenu->getButtonByName("reply");
    if (buttonReply2) {
        buttonReply2->setActionFunction(this,callfuncO_selector(GameScene::buttonRestartAction) );
    }
    buttonShop2 = gameoverMenu->getButtonByName("shopb");
    if (buttonShop2) {
        buttonShop2->setActionFunction(this,callfuncO_selector(GameScene::onShowShop) );
    }
    
    // инициализация всплывающего меню Задания перед игрой
    tasksMenu = new PopupMenu("menu_task.plhs");
    tasksMenu->setOnShowFunc(this, callfuncO_selector(GameScene::onShowTaskMenu));
    FlyTask::initWithMenu( tasksMenu );
    
    
    buttonResume2 = tasksMenu->getButtonByName("resume");
    if (buttonResume2) {
        buttonResume2->setActionFunction(this,callfuncO_selector(GameScene::buttonResume2Action) );
    }

    
    tutorial1 = NULL;
    tutorial2 = NULL;
    tutorial3 = NULL;
    tutorial4 = NULL;
    
    ratingMenu = new PopupMenu("rating.plhs");
    ratingMenu->setOnShowFunc(UserRating::getInstance(), callfuncO_selector(UserRating::onPreShowRatingMenu));
    ratingMenu->setOnEndShowFunc(UserRating::getInstance(), callfuncO_selector(UserRating::onAfterShowRatingMenu));

    nextRatingButton = ratingMenu->getButtonByName("resume");
    if (nextRatingButton) {
        nextRatingButton->setActionFunction(UserRating::getInstance(), callfuncO_selector(UserRating::onNextButton));
    }
    
    /*gameoverMenu->addSpriteName("buttonResume2");
    gameoverMenu->addSpriteName("backgroundGameover");
    gameoverMenu->addSpriteName("labelGameover");
    
*/
    
    
    startMainMenu();
    
    /*
    
    setPosition(camPntMainMenu->cameraPosition);
    //setAnchorPoint(ccp(1,1));
    //setPosition(ccp(0, -480));

    
    
    runAction(
              CCSequence::create(
                                 CCDelayTime::create(5),
                                 CCEaseExponentialOut::create(CCMoveTo::create(0.5, ccp(0,0))),
                                 NULL
                                 )
              );
    
    */
    
    initLevelHelperOnce();
    
    initNewGame();
////////////////// LEVEL HELPER INIT HERE ENDED ////////////////////////   
    
    
	/// run cycle
	schedule( schedule_selector(GameScene::tick) );
	schedule( schedule_selector(GameScene::tick10),0.1 );
	schedule( schedule_selector(GameScene::tick60),1 );
    

    /*CCNotificationCenter::sharedNotificationCenter()->addObserver(this,
                                                           callfuncO_selector(GameScene::spriteAnimHasEnded),
                                                           LHAnimationHasEndedNotification,
      
                                                     NULL);
*/    
    
}




GameScene::~GameScene(void)
{
/*    CCNotificationCenter::sharedNotificationCenter()->removeObserver(this,
                                                                     LHAnimationHasEndedAllRepetitionsNotification);
  */  
	TESTLOG("GameScene::~GameScene(void)");
	
    params::getInstance()->saveAll();
    PlayEvents::getInstance()->onSaveAll();

    //BonusItem::destroyAllItems();
    
    
    //AliensManager::getInstance()->re
    
	/*
     
     
     
     CFigureUnit::removeAllSprite();
     */
    
	//Game::destroyInstance();
	
	//delete m_debugDraw;
}
//------------------------------------------
void GameScene::buttonPlayAction(CCObject * object)
{
    startPlay();
}

//------------------------------------------
void GameScene::buttonShopAction(CCObject * object)
{
    
}
//------------------------------------------
void GameScene::buttonPauseAction(CCObject * object)
{
    
   if (gameState == GAMESTATE_PLAY) {
        setPause();
       pauseMenu->showMenu(0.2);
       pauseButton->setEnabled(false);
       
    }else{
        resumePlay();
        pauseMenu->hideMenu(0.2);
        pauseButton->setEnabled(true);
    }
}

void GameScene::buttonResumeAction(CCObject * object)
{
    
    if (gameState != GAMESTATE_PLAY) {

        resumePlay();
        pauseMenu->hideMenu(0.2);
        pauseButton->setEnabled(true);
    }
}

void GameScene::buttonResume2Action(CCObject * object)
{
    
    if (gameState != GAMESTATE_PLAY) {
        
        resumePlay();
        tasksMenu->hideMenu(0.2);
        pauseButton->setEnabled(true);
    }
}


//------------------------------------------
void GameScene::buttonRestartActionWithRating(CCObject * object)
{
    pauseMenu->hideMenu(0.2);
    gameoverMenu->hideMenu(0.2);

    
    endOfPrevGame();


    if (UserRating::getInstance()->completedTasks.size() > 0) {
        UserRating::getInstance()->onEndGame(loader);
        UserRating::getInstance()->showRatingFrom = 1;
    }else{
        resumePlay();
        pauseButton->setEnabled(true);
        restartGame();
    }


    
}

void GameScene::buttonRestartAction(CCObject * object)
{
    pauseMenu->hideMenu(0.2);
    gameoverMenu->hideMenu(0.2);
    
    endOfPrevGame();
    
    resumePlay();
    pauseButton->setEnabled(true);
    restartGame();
    
    
}


void GameScene::buttonChangeSound(CCObject * object)
{
    if (buttonSound) {
        if (buttonSound->isChecked()) {
            params::getInstance()->soundOn = 0;
        }else{
            params::getInstance()->soundOn = 1;
        }
        params::getInstance()->saveSoundMusic();
    }
}
void GameScene::buttonChangeMusic(CCObject * object)
{
    if (buttonMusic) {
        if (buttonMusic->isChecked()) {
            params::getInstance()->musicOn = 0;
        }else{
            params::getInstance()->musicOn = 1;
        }
        params::getInstance()->saveSoundMusic();
    }
    
}
// on show pause menu
void GameScene::onShowPauseMenu(CCObject * object)
{
    char text[30];
    params * pr = params::getInstance();
    
    sprintf( text, "Score: %s", intToNormalStr( score ).c_str());
    pauseMenu->setLabelText("score", text);

    sprintf( text, "Coins: %i", coins);
    pauseMenu->setLabelText("coins", text);
    
    sprintf( text, "Level: %i", LevelLoader::getInstance()->curStageNumber);
    pauseMenu->setLabelText("level", text);
    
    sprintf( text, "Hi score: %s", intToNormalStr(pr->hiScore).c_str());
    pauseMenu->setLabelText("hiScore", text);

    sprintf( text, "Total Coins: %i", pr->totalCoins);
    pauseMenu->setLabelText("totalCoins", text);

    sprintf( text, "Level Record: %i", pr->hiLevelRecord);
    pauseMenu->setLabelText("hiLevel", text);

    PlayEvents::getInstance()->onShowPauseMenu();
    
}



void GameScene::onShowGameoverMenu(CCObject * object)
{
    char text[30];
    params * pr = params::getInstance();
    
    sprintf( text, "Score: %s", intToNormalStr(score).c_str() );
    gameoverMenu->setLabelText("score", text);
    
    sprintf( text, "Coins: %i", coins);
    gameoverMenu->setLabelText("coins", text);
    
    sprintf( text, "Level: %i", LevelLoader::getInstance()->curStageNumber);
    gameoverMenu->setLabelText("level", text);
    
    sprintf( text, "Hi score: %s", intToNormalStr(pr->hiScore).c_str());
    gameoverMenu->setLabelText("hiScore", text);
    
    sprintf( text, "Total Coins: %i", pr->totalCoins);
    gameoverMenu->setLabelText("totalCoins", text);
    
    PlayEvents::getInstance()->onShowGameOverMenu();

    
}

//перед показом меню текущих задач
void GameScene::onShowTaskMenu(CCObject * object)
{
    /*char text[30];
    params * pr = params::getInstance();
    
    sprintf( text, "Score: %s", intToNormalStr(score).c_str() );
    gameoverMenu->setLabelText("score", text);
    
    sprintf( text, "Coins: %i", coins);
    gameoverMenu->setLabelText("coins", text);
    
    sprintf( text, "Level: %i", LevelLoader::getInstance()->curStageNumber);
    gameoverMenu->setLabelText("level", text);
    
    sprintf( text, "Hi score: %s", intToNormalStr(pr->hiScore).c_str());
    gameoverMenu->setLabelText("hiScore", text);
    
    sprintf( text, "Total Coins: %i", pr->totalCoins);
    gameoverMenu->setLabelText("totalCoins", text);
    
    PlayEvents::getInstance()->onShowGameOverMenu();
    */
    
    if( tasksMenu )
    {
    
        tasksMenu->setLabelText("task1", "");
        tasksMenu->setLabelText("task2", "");
        tasksMenu->setLabelText("task3", "");
        
        menuElement * star1 = tasksMenu->getElementByName("star1");
        menuElement * star2 = tasksMenu->getElementByName("star2");
        menuElement * star3 = tasksMenu->getElementByName("star3");
    

        CTask * task = NULL;
        if(CTaskManager::getInstance()->currentTasks.size()>=1)
        {
            
            task = CTaskManager::getInstance()->currentTasks[0];
            if (task) {
                tasksMenu->setLabelText("task1", task->getText());
            }
            if (star1) {
                star1->isVisible = true;
            }
        }else{
            if (star1) {
                star1->isVisible = false;
            }
        }
        
        if(CTaskManager::getInstance()->currentTasks.size()>=2)
        {
            task = CTaskManager::getInstance()->currentTasks[1];
            if (task) {
                tasksMenu->setLabelText("task2", task->getText());
            }
            if (star2) {
                star2->isVisible = true;
            }
        }else{
            if (star2) {
                star2->isVisible = false;
            }
        }
        
        if(CTaskManager::getInstance()->currentTasks.size()>=3)
        {
            task = CTaskManager::getInstance()->currentTasks[2];
            if (task) {
                tasksMenu->setLabelText("task3", task->getText());
            }
            if (star3) {
                star3->isVisible = true;
            }
        }else{
            if (star3) {
                star3->isVisible = false;
            }
        }
    
    }

    PlayEvents::getInstance()->onShowTaskMenu();
    
}

void GameScene::onShowRatingMenu(CCObject * object)
{
    UserRating::getInstance()->onPreShowRatingMenu(loader);
}

void GameScene::onShowShop(CCObject * object)
{
    // show shop
    Shop::getInstance()->showShop();
}

bool GameScene::isTutorial(int tutorial)
{
    if (CTaskManager::getInstance()->isTutorial()) {
        if (tutorialCount == tutorial) {
            return true;
        }
    }
    return false;
}

void GameScene::onShowTutorial1(CCObject * object)
{
    if(CTaskManager::getInstance()->tutorialLabels.size()>0)
    {
        tutorial1->setLabelText("label", CTaskManager::getInstance()->updateText(CTaskManager::getInstance()->tutorialLabels[0]));
    }
}
void GameScene::onShowTutorial2(CCObject * object)
{
    if(CTaskManager::getInstance()->tutorialLabels.size()>1)
    {
        tutorial2->setLabelText("label", CTaskManager::getInstance()->updateText(CTaskManager::getInstance()->tutorialLabels[1]));
    }
    
}
void GameScene::onShowTutorial3(CCObject * object)
{
    if(CTaskManager::getInstance()->tutorialLabels.size()>2)
    {
        tutorial3->setLabelText("label", CTaskManager::getInstance()->updateText(CTaskManager::getInstance()->tutorialLabels[2]));
    }
    
}
void GameScene::onShowTutorial4(CCObject * object)
{
    if(CTaskManager::getInstance()->tutorialLabels.size()>3)
    {
        tutorial4->setLabelText("label", CTaskManager::getInstance()->updateText(CTaskManager::getInstance()->tutorialLabels[3]));
    }
    
}

string GameScene::intToNormalStr(int value)
{
    
    char tmp[32];
    sprintf(tmp, "%i", value);
    int len = strlen(tmp);
    string result = "";
    int count = 0;
    for (int i=len-1; i>=0; i--) {
        
        if ((count%3==0)&&(count>0)) {
            result = "." + result;
        }
        result = tmp[i] + result;
            
        count++;
    }
    return result;
}

// инициализация лоадера уровня(LevelHelper)
void GameScene::initLevelHelperOnce(  )
{
	TESTLOG("GameScene::initLevelHelper");
    
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

	laser = new Laser();

    aimLeft = loader->spriteWithUniqueName("aimLeft");
    if (aimLeft) {
        aimLeft->setVisible(false);
        aimLeft->setAnchorPoint(ccp(0,1));
    }
    aimRight = loader->spriteWithUniqueName("aimRight");
    if (aimRight) {
        aimRight->setVisible(false);
        aimRight->setAnchorPoint(ccp(1,1));
    }
    
    
    levelStatus = loader->spriteWithUniqueName("levelStatus");
    if (levelStatus) {
        levelStatus->prepareAnimationNamed("level_status", "sprites.pshs");
        levelStatus->setFrame(0);
    }
    
    
    LHSprite * tmpSprite = loader->spriteWithUniqueName("figureBeginPoint");
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
	//	figureStartPoint = figureEndPoint;
	//	figureStartPoint.y = figureEndPoint.y + 200;
	//	BonusItem::bubbleEndPoint = figureStartPoint;
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


    moon = loader->spriteWithUniqueName("moon");

    
    if (moon) {
        // спешл фор Димон
        /*CCLabelBMFont * dimon = CCLabelBMFont::create("Kazakov Dmitry", "menu.fnt");
        dimon->setPosition(moon->getPosition());
        dimon->setPositionY(dimon->getPositionY()-100);
        
        dimon->runAction(Effect::moonRotate(100));
        Game::getGameLayer()->addChild(dimon);
        */
        //
        moon->runAction(Effect::moonRotate(100));
        
    }
    gameOverSprite = loader->spriteWithUniqueName("gameOverSprite");
    if (gameOverSprite) {
        gameOverSprite->setVisible(false);

        CCNotificationCenter::sharedNotificationCenter()->addObserver(this,
                                                                      callfuncO_selector(GameScene::gameOverAnimHasEnded),
                                                                      LHAnimationHasEndedNotification,
                                                                      gameOverSprite);
        
        
        //gameOverSprite->playAnimation();
        
    }
    
    /*buttonPause = loader->spriteWithUniqueName("megabomb");
    if (buttonPause) {
        buttonPause->registerTouchBeganObserver(this, callfuncO_selector(GameScene::touchBeginOnSprite));
        buttonPause->registerTouchMovedObserver(this, callfuncO_selector(GameScene::touchMovedOnSprite));
        buttonPause->registerTouchEndedObserver(this, callfuncO_selector(GameScene::touchEndedOnSprite));
    }*/
    
    CosmoMeter::getInstance()->loadFromLevel(loader);
    
    CosmoBonuses::getInstance()->loadInfo(loader);
    
    setupScore();
    
    setupLevelLabel();
    
    infoScore = new InfoLabel("points",CORNERTYPE_LT);
    infoScore->setValue(0);
    
    infoLevel = new InfoLabel("level",CORNERTYPE_RT);
    infoLevel->setValue("lvl:1");
    
    infoCoins = new InfoLabel("coins",CORNERTYPE_LT);
    infoCoins->setValue(0);
    
    // set up audio
    setupAudio();

    
}




CCScene* GameScene::scene()
{
	TESTLOG("CCScene* GameScene::scene()");
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
		
		TESTLOG("void GameScene::initFirst()");

		isInitialed = true;

		// init bonuses for level
		Bonus::initBonuses();
        
        //CosmoBonuses::getInstance()->loadInfo(loader);

		loadRespawnPoints();
        
        loadBubblesStartPoints();

		//initStarsAndPlanets();

		clearTemplatesFromLevel();
        
        Shop::getInstance();

		/// create new figure
		figureCreateNew();
	}
}

///--------------------------------------
///   UPDATE CYCLE
///--------------------------------------
void GameScene::tick10(float dt)
{

}
void GameScene::tick60(float dt)
{
}

void GameScene::tick(float dt)
{
	//TESTLOG("GameScene::tick");
	//It is recommended that a fixed time step is used with Box2D for stability
	//of the simulation, however, we are using a variable time step here.
	//You need to make an informed choice, the following URL is useful
	//http://gafferongames.com/game-physics/fix-your-timestep/
	
    if (!isPlayingNow()) {
        return;
    }
    
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
	if (currentAlien && backingAlien) {
		backingAlien->getSprite()->setPosition(currentAlien->getSprite()->getPosition());
        backingAlien->getSprite()->setRotation(currentAlien->getSprite()->getRotation());
    }
    //-------------------------------------------------------------

	if( isGameOver )
		return;

	//-------------------------------------------------------------
	// FALL STATUS
    
    if (stateFigure == STATE_FIGURE_CONTROL) {
        Stage * stg = LevelLoader::getInstance()->getCurStage(); 
        if ( stg!=NULL) {
            curTickCount += dt;
            if(stg->waiting_time > 0)
                fallStatusUpdate( ((100.0 * curTickCount) / stg->waiting_time) );
            
            if (curTickCount >= (stg->waiting_time)) {
				TESTLOG("tick: free figure to fly automatically!");
                figureMakeDynamic();
                fastFallDown = false;
            }
        }else{
			TESTLOG("tick: NOT FOUND STAGE!");
		}
    }
	//--------------------------------------------------------
	//

    
	//--------------------------------------------------------
    // DURING TIME UPDAYE
    DuringTime::updateDuring(dt);
	//--------------------------------------------------------

	//--------------------------------------------------------
	
	//--------------------------------------------------------
    // CosmoBonuses
    CosmoBonuses::getInstance()->update(dt);
	//--------------------------------------------------------

    
    
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
			TESTLOG("tick: COMBOTIME is out");
        }
    }
	//--------------------------------------------------------
    
    
    //---TUTORIAL---------------------------------------------
    if (CTaskManager::getInstance()->isTutorial()) {
        if(timeToNextTutorial>0){
            timeToNextTutorial = timeToNextTutorial - dt;
            if (timeToNextTutorial<=0) {
                timeToNextTutorial = 0;
                if (tutorialStep==TUTORIAL_SHOWING) {
                    //закрыть первое окно
                    hideTutorial = true;
                }
            }
        }
        if (isTutorial(1) && tutorialStep==TUTORIAL_SHOWING && tutorialStepDone && hideTutorial ) {
            tutorial1->hideMenu(0.4);
            tutorialCount   = 2;
            tutorialStep    = TUTORIAL_NEED_TO_SHOW;
            hideTutorial    = false;
            tutorialStepDone= false;
            timeToNextTutorial = 0;
        }
        if (isTutorial(2) && tutorialStep==TUTORIAL_SHOWING && tutorialStepDone && hideTutorial ) {
            tutorial2->hideMenu(0.4);
            tutorialCount   = 3;
            tutorialStep    = TUTORIAL_NEED_TO_SHOW;
            hideTutorial    = false;
            tutorialStepDone= false;
            timeToNextTutorial = 0;
        }
        if (isTutorial(3) && tutorialStep==TUTORIAL_SHOWING && hideTutorial ) {
            tutorial3->hideMenu(0.4);
            tutorialCount   = 3;
            tutorialStep    = TUTORIAL_CLOSED;
            hideTutorial    = false;
            tutorialStepDone= false;
            timeToNextTutorial = 0;
        }
        if (isTutorial(4) && tutorialStep==TUTORIAL_SHOWING && hideTutorial ) {
            tutorial4->hideMenu(0.4);
            tutorialCount   = 4;
            tutorialStep    = TUTORIAL_CLOSED;
            hideTutorial    = false;
            tutorialStepDone= false;
            timeToNextTutorial = 0;
        }
        
    }
    
    //---TUTORIAL---------------------------------------------

    /// Cosmometer update
    CosmoMeter::getInstance()->update(dt);
    ///
	//--------------------------------------------------------
	// CHECK ON FALLING SPRITE SPEED FOR BOOMs ANIMATION
	
	if (fallingAlien) {
        if (fallingAlien->getBody()) {
            b2Vec2 vec = fallingAlien->getBody()->GetLinearVelocity() ;
           
            if (abs(vec.y - prevVelocityY) > 2) {
				if( fallingAlien->animState != ANIM_STATE_FALL ){
					fallingAlien->animFigure( ANIM_STATE_FALL );
                    
                    sound::getInstance()->playRandomSound("figure_end_fall");
					/*Game::getGameLayer()->runAction( CCSequence::create(
						CCMoveTo::create( 0.1, ccp( 0, -stepOfFallingFigure)),
						CCMoveTo::create( 0.1, ccp( 0, 0)),
						NULL
						));
                    */
					fallingAlien->getSprite()->runAction( CCSequence::create( 
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
	
    //--------------------------------------------------------
    //--------------------------------------------------------
	// UPDATE ALIENS LIFE CYCLE(BLINKING, TIME TO CLEAR and etc.)
	AliensManager::getInstance()->updateTime( dt );
	//----------------------------------------------------------
	//UPDATE BONUSES
    Bonus::updateBonuses(dt);

	//----------------------------------------------------------
	
	//----------------------------------------------------------
	/// check game over interception -------------------------
    // TO DO
    // change game over check action !!!!!!!!
	
	if(laser){
		if(laser->updateLaser(dt)){
			gameOver();
		}
	}
    //----------------------------------------------------------

 
}

///--------------------------------------
///   SETUP
///--------------------------------------
/// 
///---------------------------------------------------------------------------------
void GameScene::setupCollisionHandling(){
    TESTLOGFLIGHT("GameScene::setupCollisionHandling");
    
    loader->useLevelHelperCollisionHandling();
    stageInitCollisionInit();
}
///---------------------------------------------------------------------------------
/// загрузка звуков и музыки
void GameScene::setupAudio()
{
    sound::getInstance();
}

///---------------------------------------------------------------------------------
/// настройка отображения номера уровня
bool GameScene::setupLevelLabel()
{
    return true;
}
///---------------------------------------------------------------------------------
/// настройка отображения очков
bool GameScene::setupScore()
{
    return true;
}
///---------------------------------------------------------------------------------
void GameScene::scoreFlyCreate(CCPoint point, int localScore, float delay,ccColor3B color, int figureColor)
{
    string fontName = "flyBonus.fnt";
    fontName = "flyPoints.fnt";
    if (figureColor>0 && figureColor<9) {
        char fontFlyColor[20];
        sprintf(fontFlyColor, "flyColor%i.fnt",figureColor);
        fontName = fontFlyColor;
    }
    
    if (figureColor == 100) {
        fontName = "flyPoints.fnt";
    }

    TESTLOG("GameScene::scoreFlyCreate font=%s",fontName.c_str());
    
	CCLabelBMFont * flyPointLabel = CCLabelBMFont::create("",fontName.c_str());
    
    
	if( !flyPointLabel )
		return;

	char flyPoints[10];
	if( localScore > 0 ){
		sprintf(flyPoints,"+%i",localScore);
	}else{
		sprintf(flyPoints,"-%i",localScore);
	}

	Game::getGameLayer()->addChild( flyPointLabel );
	//flyPointLabel->setOpacity(0);
	//flyPointLabel->setColor		(color);
	flyPointLabel->setString	( flyPoints );
	flyPointLabel->setPosition	(point);

    CCCallFuncN *   funcAction  = CCCallFuncN::create(
			this, 
			callfuncN_selector(GameScene::scoreFlyRemove)
		);

    vector<CCAction *> actions  = Effect::pointsFly( funcAction, delay );
	for (int j = 0; j < actions.size(); j++) {
		flyPointLabel->runAction(actions[j]);
    }

}
///---------------------------------------------------------------------------------
void GameScene::scoreFlyRemove(CCNode * node)
{
	TESTLOG("GameScene::scoreFlyRemove(CCNode * node)");

	CCLabelBMFont * flyPointLabel = (CCLabelBMFont * )node;
	if( flyPointLabel )	{
		Game::getGameLayer()->removeChild(flyPointLabel,true);
		//flyPointLabel->
	}
}
///---------------------------------------------------------------------------------
void GameScene::coinsUpdate()
{
    if (infoCoins) {
        infoCoins->setValue(coins);
    }
}
///---------------------------------------------------------------------------------
void GameScene::coinsGetIt(CCPoint point, int count)
{
    int localCount = count;
    if (count == 0) {
        int level = LevelLoader::getInstance()->curStageNumber;
        localCount = (int)(
                           (
                            (CCRANDOM_0_1() * (COIN_MAX - COIN_MIN))
                            + COIN_MIN +  level + coinAddBonus)
                             * coinMultBonus );
    }
    
    if (Shop::isUpgradedTo("coins", 4)) {
        localCount = localCount * 2;
    }else if (Shop::isUpgradedTo("coins", 3)){
        localCount = localCount * 1.5;
    }
    
    if (Shop::isUpgradedTo("coins", 5)) {
        localCount = localCount * CosmoMeter::getInstance()->getMultiplier();
    }
    
    coins += localCount;
    params::getInstance()->totalCoins += localCount;
    
    coinsFly(point,localCount);
    
    PlayEvents::getInstance()->onGetCoin(localCount);
    
    coinsUpdate();
    
}

void GameScene::coinsFly(CCPoint point, int coinsCount)
{
    CCLabelBMFont * flyCoinsLabel = CCLabelBMFont::create("","flyMoney.fnt");
	if( !flyCoinsLabel )
		return;
    TESTLOG("GameScene::coinsFly font=flyMoney.fnt");
	char flyPoints[10];
	if( coinsCount > 0 ){
		sprintf(flyPoints,"$%i",coinsCount);
	}else{
		sprintf(flyPoints,"-$%i",coinsCount);
	}
    
	Game::getGameLayer()->addChild( flyCoinsLabel,6 );
	//flyPointLabel->setOpacity(0);
	flyCoinsLabel->setColor		(ccc3(255,225,15));
	flyCoinsLabel->setString	( flyPoints );
	flyCoinsLabel->setPosition	(point);
    
    CCCallFuncN *   funcAction  = CCCallFuncN::create(
                                                      this,
                                                      callfuncN_selector(GameScene::scoreFlyRemove)
                                                      );
    
    vector<CCAction *> actions  = Effect::pointsFly( funcAction, 0 );
	for (int j = 0; j < actions.size(); j++) {
		flyCoinsLabel->runAction(actions[j]);
    }

}

///---------------------------------------------------------------------------------
void GameScene::scoreUpdate()
{
    if (infoScore) {
        infoScore->setValue(score);
    }
}
///---------------------------------------------------------------------------------
void GameScene::levelStatusUpdate()
{
    if (levelStatus) {
        Stage * stage = LevelLoader::getInstance()->getCurStage();
        if (stage) {
            int curPoints = LevelLoader::getInstance()->stageFiguresCleared;
            int maxPoints = stage->points;
            
            int percent = 0;
            if (maxPoints > 0) {
                percent = (100 * curPoints) / maxPoints;
            }
            int frame = (int)((percent * (levelStatus->numberOfFrames()-1))/100);
            if (levelStatus->currentFrame() != frame) {
                levelStatus->setFrame(frame);
            }
        }
    }
}

void GameScene::levelStatusBlink()
{
    if (levelStatus) {
        levelStatus->runAction( Effect::Bubble(1, 0.1) );
    }
}

///---------------------------------------------------------------------------------
void GameScene::levelLabelUpdate()
{
	TESTLOG("GameScene::levelLabelUpdate()");
    char tmp[20];
    int level = LevelLoader::getInstance()->curStageNumber;
    sprintf(tmp, "lvl:%i",level );
    infoLevel->setValue(tmp);
}
///---------------------------------------------------------------------------------
void GameScene::loadRespawnPoints()
{
	TESTLOG("GameScene::loadRespawnPoints()");

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
	}
}
///---------------------------------------------------------------------------------
void GameScene::loadBubblesStartPoints()
{
	TESTLOG("GameScene::loadBubblesStartPoints()");
    
	CCArray * tmpSprites =  loader->spritesWithTag( BUBBLE_START );
	if( tmpSprites ){
		for(unsigned int i=0; i < tmpSprites->count(); i++ ){
			LHSprite * sprite = (LHSprite *)tmpSprites->objectAtIndex( i );
			if(sprite){
                Bonus::startBubbles.push_back( sprite->getPosition() );
				sprite->removeSelf();
				sprite = NULL;
			}
		}
		tmpSprites->removeAllObjects();
	}
}


///---------------------------------------------------------------------------------
void GameScene::clearTemplatesFromLevel()
{
	TESTLOG("GameScene::clearTemplatesFromLevel()");
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
///---------------------------------------------------------------------------------
// init figures collision hanfler function
// need call after stage changed
void GameScene::stageInitCollisionInit()
{
	TESTLOG("GameScene::stageInitCollisionInit()");

	map<int,ccColor3B> allTagsForever;
	allTagsForever.insert(make_pair(TAG_FROM,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 1,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 2,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 3,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 4,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 5,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 6,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 7,ccc3(0,0,0)));
    allTagsForever.insert(make_pair(TAG_FROM + 8,ccc3(0,0,0)));


	map<int,ccColor3B>::iterator it = allTagsForever.begin();
	for( ; it != allTagsForever.end(); it++){
		int tag = it->first;
		loader->registerBeginOrEndCollisionCallbackBetweenTagA( (LevelHelper_TAG) tag, (LevelHelper_TAG)tag, this, callfuncO_selector(GameScene::figureTypeCollision));
	}

    
}
///---------------------------------------------------------------------------------
// clear handler collide functions after stage changed
void GameScene::stageClearCollision()
{
	TESTLOG("GameScene::stageClearCollision()");

	map<int,ccColor3B> allTagsForever;
	allTagsForever.insert(make_pair(TAG_FROM,	ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 1,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 2,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 3,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 4,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 5,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 6,ccc3(0,0,0)));
	allTagsForever.insert(make_pair(TAG_FROM + 7,ccc3(0,0,0)));
    allTagsForever.insert(make_pair(TAG_FROM + 8,ccc3(0,0,0)));

	map<int,ccColor3B>::iterator it = allTagsForever.begin();
	for( ; it != allTagsForever.end(); it++){
		int tag = it->first;
		loader->cancelBeginOrEndCollisionCallbackBetweenTagA( (LevelHelper_TAG) tag, (LevelHelper_TAG)tag);
	}
}

//----------------------------------
// FIGURE FUNCTIONS
//----------------------------------
///---------------------------------------------------------------------------------
void GameScene::figureTypeCollision(cocos2d::CCObject *object)
{
	TESTLOG("GameScene::figureTypeCollision(cocos2d::CCObject *object)");

    LHContactInfo* contact = ( LHContactInfo* ) object;
    LHSprite * spriteA = contact->spriteA();
    
    
    LHSprite * spriteB = contact->spriteB();
    if( contact->contactType == LH_BEGIN_CONTACT ){
		AliensManager::getInstance()->collide( spriteA, spriteB );
        //TESTLOG("BEGIN contact whith %s and %s", spriteA->getUniqueName().c_str(),spriteB->getUniqueName().c_str());
    }
    if( contact->contactType == LH_END_CONTACT ){
		AliensManager::getInstance()->uncollide( spriteA, spriteB );
        //TESTLOG("END contact whith %s and %s", spriteA->getUniqueName().c_str(),spriteB->getUniqueName().c_str());
    }
}
///---------------------------------------------------------------------------------
/// create new falling figure sprite
void GameScene::figureCreateNew()
{
    ///random surprise bonus!
    Bonus::surpriseBonus();
    
    TESTLOG("GameScene::figureCreateNew()");

    //LHBezierNode * startPath = loader->bezierNodeWithUniqueName("startPath");
    if( true ){
        Stage * stg = LevelLoader::getInstance()->getCurStage();
        if (!stg) {
            TESTLOG("NOT FOUND CURRENT STAGE");
            return;
        }
        
        if (!nextFigure) {
			
            nextFigure = stg->randomFigure();
			TESTLOG("GameScene::figureCreateNew first generate of new figure %i",nextFigure);
        }
        
        Figure * figure = nextFigure;
        /// random angle for new figure

        float angle = stg->rotationAngle * 2;

		
        float rndFigureAngle = CCRANDOM_0_1() * angle - (angle / 2);

        /// generate new figure
        nextFigure = stg->randomFigure();
		TESTLOG("GameScene::figureCreateNew generate of next figure %i",nextFigure);

       if (figure!=NULL) {
		   Alien * alien = AliensManager::getInstance()->createAlien( figure );

		   currentAlien = alien;
           stateFigure = STATE_FIGURE_FALL;
		   alien->animFigure( ANIM_STATE_NORMAL );
		   alien->getSprite()->setPosition(figureStartPoint);

           CCCallFuncN * funcPosition = CCCallFuncN::create(this, callfuncN_selector(GameScene::figureEndOfPath));
			
           alien->getSprite()->runAction( CCRotateTo::create( 0.5, rndFigureAngle ));
           alien->getSprite()->runAction( CCSequence::create( CCMoveTo::create( 0.6, figureEndPoint ),funcPosition,NULL));
           
           PlayEvents::getInstance()->onCreateFigure(alien);
           
           //sound::getInstance()->playFirstSound("figure_create");
           
           //CocosDenshion::SimpleAudioEngine::sharedEngine()->playEffect("bubble_bang.mp3", false);
           //TESTLOG("SOUND ID = %i",sound);


            //-------------------------------------------
			// backing sprite proccess
            if (backingAlien) {
                if (prevBackingAlien) {
					AliensManager::getInstance()->removeAlien( prevBackingAlien );
                    prevBackingAlien = NULL;
					//prevBackingAlien->getSprite()->removeSelf();
                }
                prevBackingAlien = backingAlien;
                
                prevBackingAlien->getSprite()->setOpacity(100);
                CCScaleTo * scale1  = CCScaleTo::create(0.7, 2);
                CCFadeOut * fade1   = CCFadeOut::create(0.7);
                CCMoveBy * move1   = CCMoveBy::create(0.7, ccp(0,-20));

                prevBackingAlien->getSprite()->stopAllActions();
                prevBackingAlien->getSprite()->runAction(scale1);
                prevBackingAlien->getSprite()->runAction(fade1);
                prevBackingAlien->getSprite()->runAction(move1);                
                
            }
            
			backingAlien = AliensManager::getInstance()->createShadowAlien( alien );
            //backingAlien->removeEyes();

			//backingAlien->getSprite()->setColor(ccc3(255,255,255));
			backingAlien->getSprite()->setScale(1.1);
			backingAlien->getSprite()->setOpacity(100);

			CCFadeTo * fadein   = CCFadeTo::create(0.3, 200);
            CCFadeTo * fadeout  = CCFadeTo::create(0.3, 50);
            CCScaleTo * scaleTo1 = CCScaleTo::create(0.3, 1.15);
            CCScaleTo * scaleTo2 = CCScaleTo::create(0.3, 1.05);           
			
            backingAlien->getSprite()->runAction(CCRepeatForever::create( (CCSequence*)CCSequence::create( fadein, fadeout, NULL ) ) );
            backingAlien->getSprite()->runAction(CCRepeatForever::create( (CCSequence*)CCSequence::create( scaleTo1, scaleTo2, NULL ) ) );

        
            
            CCNode * parentNode = backingAlien->getSprite()->getParent();
            if (parentNode) {
                parentNode->reorderChild(backingAlien->getSprite(), backingAlien->getSprite()->getZOrder()-1);
            }
        }

		if (nextFigure!=NULL) {
			if( nextFigureAlien == NULL){
                // создаем изображение следующей фигуры
				nextFigureAlien = AliensManager::getInstance()->createNextAlien( nextFigure );

				//nextFigureSprite = LHSprite::batchSpriteWithName(figure->getSpriteName(), typesBatch);
				
				nextFigureAlien->getSprite()->setScale(0.5);
				nextFigureAlien->getSprite()->setPosition(ccp(
				nextFigureXPosition ,
				winSize.height - nextFigureAlien->getSprite()->boundingBox().size.height/2
				));
                //nextFigureSprite->setZOrder(10);
                
                /// отодвигаем изображение следующей фигуры на слой назад
                CCNode * parentNode = nextFigureAlien->getSprite()->getParent();
                if (parentNode) {
                    parentNode->reorderChild(nextFigureAlien->getSprite(), nextFigureAlien->getSprite()->getZOrder()-1);
                }
			}
            
            /// эффект изменения изображения со следующей фигуры
            CCScaleTo * scale1	= CCScaleTo::create( 0.1, 0.5, 0.5 );
			CCScaleTo * scale2	= CCScaleTo::create( 0.1, 0.6, 0.6 );
			CCScaleTo * scale3	= CCScaleTo::create( 0.1, 0.1, 0.1 );
			//change color
			CCCallFuncND *   funcChangeColorAction = 
                CCCallFuncND::create(this, callfuncND_selector(GameScene::changeColorNextFigure),(void*)nextFigure);


			nextFigureAlien->getSprite()->runAction( CCSequence::create( scale1,scale2,scale3,funcChangeColorAction,NULL ) );
        }
        
    }
    
}
///---------------------------------------------------------------------------------
//// callback when we can control position of figure 
void GameScene::figureEndOfPath(CCNode * node)
{
	TESTLOG("GameScene::figureEndOfPath(CCNode * node)");

    LHSprite* sprite = (LHSprite*) node;
	if( !sprite ) {
		TESTLOG( "figureEndOfPath: SPRITE NOT FOUND i" );
		return;
	};
	Alien * oldAlien = AliensManager::getInstance()->alienBySprite( sprite );
	if( !oldAlien ) {
		TESTLOG( "figureEndOfPath: SPRITE NOT FOUND i" );
		return;
	}
     
	Alien * newAlien = AliensManager::getInstance()->createPhysicsAlien( oldAlien, false );

	currentAlien = newAlien;
	currentAlien->animFigure( ANIM_STATE_NORMAL );

	curTickCount = 0;
    stateFigure = STATE_FIGURE_CONTROL;

	AliensManager::getInstance()->removeAlien( oldAlien );
	
	//loader->removeSprite( sprite );

    /// start of fall status time
    fallStatusStart();

		// make a prizmatic joint
	if(!currentAlien->getBody())
			return;
		//bounds
	LHBezier * bounds = loader->bezierWithUniqueName("bounds");
	if(!bounds)
		return;
	

    b2PrismaticJointDef jointDef;
    b2Vec2 worldAxis(1.0f, 0.0f);
    jointDef.collideConnected = true;
    jointDef.Initialize(currentAlien->getBody(), bounds->getBody()/*loader->leftPhysicBoundary()*/,
                        currentAlien->getBody()->GetWorldCenter(), worldAxis);
    
    prismaticJoint = (b2PrismaticJoint *)world->CreateJoint(&jointDef);
    if(!prismaticJoint){
        TESTLOG("GameScene::figureEndOfPath can't create prismaticJoint");
        return;
    }

    currentAlien->getSprite()->runAction( Effect::Bubble(0.5, 0.1));
    
    PlayEvents::getInstance()->onStartControlFigure(currentAlien);
    // TUTORIAL
    // показываем меню про управление пальцем
    if (isTutorial(1)) {
        if (tutorialStep == TUTORIAL_NEED_TO_SHOW) {
            tutorial1->showMenu(0.4);
            tutorialStep = TUTORIAL_SHOWING;
            timeToNextTutorial = 5;
        }
    }

    if (isTutorial(2)) {
        if (tutorialStep == TUTORIAL_NEED_TO_SHOW) {
            tutorial2->showMenu(0.4);
            tutorialStep = TUTORIAL_SHOWING;
            timeToNextTutorial = 5;
        }
    }

    if (isTutorial(3)) {
        if (tutorialStep == TUTORIAL_NEED_TO_SHOW) {
            tutorial3->showMenu(0.4);
            tutorialStep = TUTORIAL_SHOWING;
            timeToNextTutorial = 5;
        }
    }
    if (isTutorial(4)) {
        if (tutorialStep == TUTORIAL_NEED_TO_SHOW) {
            tutorial4->showMenu(0.4);
            tutorialStep = TUTORIAL_SHOWING;
            timeToNextTutorial = 5;
        }
    }
    
    
    if( fallingCount > 0 )
    {
        figureMakeDynamic();
    }
}
///---------------------------------------------------------------------------------	
/// figure makes physicly and it will fall down
void GameScene::figureMakeDynamic( bool needCreateNew)
{
	TESTLOG("GameScene::figureMakeDynamic( bool needCreateNew)");
    
    if (currentAlien!=NULL) {
		if(currentAlien->getBody())
			currentAlien->getBody()->SetLinearVelocity(b2Vec2(0,0));
		else{
			//TESTLOG( "GameScene::figureMakeDynamic sprite %s haven't body",currentSprite->getUniqueName().c_str() );
		}
        
        fallStatusEnd();

		if(prismaticJoint){
			TESTLOG( "GameScene::figureMakeDynamic >DestroyJoint(prismaticJoint);" );
			world->DestroyJoint(prismaticJoint);
			prismaticJoint = NULL;
		}else{
			TESTLOG( "GameScene::figureMakeDynamic prismaticJoint = NULL" );
		}
		
		if (mouseJoint) {
			TESTLOG( "GameScene::figureMakeDynamic >DestroyJoint(mouseJoint);" );
			world->DestroyJoint(mouseJoint);	
			mouseJoint = NULL;
		}else{
			TESTLOG( "GameScene::figureMakeDynamic mouseJoint = NULL" );
		}
    }
    
    AliensManager::getInstance()->addToPool(currentAlien);
    
    ///create next figure
	if( isGameOver )
		return;

	if(fallingAlien){

	}
    /// задаем падающую фигуру
	fallingAlien = currentAlien;
    
	if( needCreateNew && fallingCount == 0 ){

		figureCreateNew();
	}
}
///---------------------------------------------------------------------------------
void GameScene::changeColorNextFigure(CCNode * node, void * data)
{
	TESTLOG("GameScene::changeColorNextFigure(CCNode * node, void * data)");

	LHSprite * sprite = (LHSprite *)node;
	if( sprite){
		Figure * figure = (Figure*)data;
		Alien * alien = AliensManager::getInstance()->alienBySprite(sprite);

		CCScaleTo * scale4	= CCScaleTo::create( 0.3, 0.7, 0.7 );
		CCScaleTo * scale5	= CCScaleTo::create( 0.2, 0.4, 0.4 );
		CCScaleTo * scale6	= CCScaleTo::create( 0.1, 0.44, 0.44 );
		CCScaleTo * scale7	= CCScaleTo::create( 0.1, 0.6, 0.6 );
		CCScaleTo * scale8	= CCScaleTo::create( 0.1, 0.5, 0.5 );
        CCCallFuncN * funcPosition = CCCallFuncN::create(this, callfuncN_selector(GameScene::changePositionNextFigure));
        
		alien->changeFigure( figure );

		alien->getSprite()->runAction( CCSequence::create( 
				scale4,scale5,scale6,scale7,scale8,funcPosition,NULL
				) );
	}
}
///---------------------------------------------------------------------------------
void GameScene::changePositionNextFigure(CCNode * node)
{
	TESTLOG("GameScene::changePositionNextFigure(CCNode * node)");

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
///---------------------------------------------------------------------------------
int GameScene::checkCombo( CCPoint pos )
{
	TESTLOG("GameScene::checkCombo( CCPoint pos )");

    comboCount++;
    comboTime = COMBO_TIME ;

    if (comboCount >= 2) {
        LHSprite * comboSprite = NULL;
        
        switch (comboCount) {

            case 2:
                //combo 2x
                scoreHitAtPosition(pos, -10, 1.0);
//				Game::getGameLayer()->stopAllActions();
//                Game::getGameLayer()->runAction(Effect::ShakeWorld1());
                comboSprite = loader->createBatchSpriteWithUniqueName("combo2x");

                PlayEvents::getInstance()->onCombo2x();
                
                TESTLOG("GameScene::checkCombo combo 2x");

                Test::getInstance()->Checkpoint("COMBO 2X");
                
                break;
            case 3:
                //combo 3x
                scoreHitAtPosition(pos, -11, 1.0);
//                Game::getGameLayer()->stopAllActions();
//                Game::getGameLayer()->runAction(Effect::ShakeWorld2());
                comboSprite = loader->createBatchSpriteWithUniqueName("combo3x");
                
                PlayEvents::getInstance()->onCombo3x();
                
                TESTLOG("GameScene::checkCombo combo 3x");
                
                Test::getInstance()->Checkpoint("COMBO 3X");
                
                
                break;
            case 4:
                //super
                scoreHitAtPosition(pos, -12, 1.0);
//                Game::getGameLayer()->stopAllActions();
//                Game::getGameLayer()->runAction(Effect::ShakeWorld3());
                comboSprite = loader->createBatchSpriteWithUniqueName("superCombo");
                
                PlayEvents::getInstance()->onSuperCombo();

                Test::getInstance()->Checkpoint("SUPER COMBO");
                
                TESTLOG("GameScene::checkCombo combo 4x");
                break;
                
            case 5:
                /// mega combo
                scoreHitAtPosition(pos, -13, 1.0);
//                Game::getGameLayer()->stopAllActions();
//                Game::getGameLayer()->runAction(Effect::ShakeWorld4());
                comboSprite = loader->createBatchSpriteWithUniqueName("megaCombo");
                
                PlayEvents::getInstance()->onMegaCombo();

                Test::getInstance()->Checkpoint("MEGA COMBO");
                
                TESTLOG("GameScene::checkCombo MEGA combo");
                break;
            default:
                /// cosmo combo
                scoreHitAtPosition(pos, -14, 1.0);
                //Game::getGameLayer()->stopAllActions();
//                Game::getGameLayer()->runAction(Effect::ShakeWorld4());
                comboSprite = loader->createBatchSpriteWithUniqueName("cosmoCombo");
                
                PlayEvents::getInstance()->onCosmoCombo();
                
                Test::getInstance()->Checkpoint("COSMO COMBO");
                
                TESTLOG("GameScene::checkCombo MEGA combo");
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
        
    }else{
        //Game::getGameLayer()->stopAllActions();
        //Game::getGameLayer()->runAction(Effect::ShakeWorld0());
    }

	return comboCount;
}


//------------------------------
// MENU AND GAME STATE
//------------------------------
///---------------------------------------------------------------------------------
//- перезапуск уровня
void GameScene::restartGame()
{

	TESTLOGFLIGHT("GameScene::restartGame");
	
	destroyGameData();
    initNewGame();
    
    PlayEvents::getInstance()->onStartGame();
    
    // загрузка заданий на игру
    CTaskManager::getInstance()->loadCurrentTasks();
    if (CTaskManager::getInstance()->currentTasks.size() > 0) {
        if (CTaskManager::getInstance()->isTutorial()) {
            if (!tutorial1) {
                tutorial1 = new PopupMenu("tutorial1.plhs",true);
                tutorial1->setOnShowFunc(this, callfuncO_selector(GameScene::onShowTutorial1));
            }else{
                if (tutorial1->isShowing) {
                    tutorial1->hideMenu(0);
                }
            }
            
            if (!tutorial2) {
                tutorial2 = new PopupMenu("tutorial2.plhs",true);
                tutorial2->setOnShowFunc(this, callfuncO_selector(GameScene::onShowTutorial2));
            }else{
                if (tutorial2->isShowing) {
                    tutorial2->hideMenu(0);
                }
            }
            
            if (!tutorial3) {
                tutorial3 = new PopupMenu("tutorial3.plhs",true);
                tutorial3->setOnShowFunc(this, callfuncO_selector(GameScene::onShowTutorial3));
            }else{
                if (tutorial2->isShowing) {
                    tutorial2->hideMenu(0);
                }
            }
            
            if (!tutorial4) {
                tutorial4 = new PopupMenu("tutorial4.plhs",true);
                tutorial4->setOnShowFunc(this, callfuncO_selector(GameScene::onShowTutorial4));
            }else{
                if (tutorial4->isShowing) {
                    tutorial4->hideMenu(0);
                }
            }
            
            
            tutorialCount       = 1;
            tutorialStep        = TUTORIAL_NEED_TO_SHOW;
            hideTutorial        = false;
            tutorialStepDone    = false;
            tutorialStepDoneResrved = false;
            timeToNextTutorial  = 0;
        }
        
        setPause();
        tasksMenu->showMenu(0.2);
        pauseButton->setEnabled(false);
    }
    
    //инициализация космометра
    CosmoMeter::getInstance()->startGame();
    
    
}

/// инициализация новой игры
/// запускается при перезапуске уровня
void GameScene::initNewGame()
{
		TESTLOGFLIGHT("GameScene::initNewGame()");
    
	// clear old collision colors
    fastFallDown            = false;
    fastFallDownMaxTime     = 1;
    fastFallDownCounter     = 0;
    touchFastFallDown       = NULL;
    spriteRotation          = 0;
    touchMoveRotate         = NULL;
    
	//rectGameOver;//!!!!!!!!!!!!
    isGameOver              = false;
    
    nextFigure              = NULL;
	nextFigureAlien			= NULL;
    
    nextFigureXPosition     = winSize.width/2;
    
    
	isInitialed				= false;
	mouseJoint				= NULL;
	prismaticJoint			= NULL;
    
	score					= 0;
	figureCleared			= 0;
    coins                   = 0;
    coinAddBonus            = 0;
    coinMultBonus           = 1;
    
    
    prevVelocityY           = 0;
    
    comboCount              = 0;
    comboTime               = 0;
    
    
    currentAlien           = NULL;
    fallingAlien           = NULL;
    backingAlien           = NULL;
    prevBackingAlien       = NULL;
    fallStatus             = NULL;
    
    stateFigure = STATE_FIGURE_CREATE;
    
    ///load all
    params::getInstance()->loadAll();
    
	levelPack = LevelLoader::getInstance()->getCurLevelPack();
	if( !levelPack ){
		TESTLOG("NOT FOUND LEVEL PACK");
        return;
    }
    
    quest = levelPack->getCurQuest();
    if (!quest) {
		TESTLOG("NOT FOUND QUEST");
        return;
    }
    
    QUESTS->init(quest);
    
    multiplier = quest->multiplier;
    
    
	level = LevelLoader::getInstance()->getCurLevel();
	if( !level ){
		TESTLOG("NOT FOUND LEVEL");
        return;
    }
    // init new level parameters
    LevelLoader::getInstance()->initNewLevel();
    
    // randomize
    srand(time(NULL));
    CCRANDOM_0_1();
    
    
	AliensManager::getInstance()->removeAllSprite();
    
    if(gameOverSprite)
    {
        gameOverSprite->setVisible(false);
        gameOverSprite->prepareAnimationNamed("gameOver", "tresk.pshs");
    }
    
    if (laser) {
        laser->setType(LASER_STAY);
    }
    
    if (aimLeft && aimRight) {
        aimLeft->setVisible(false);
        
        aimRight->setVisible(false);
        
    }
    
    coinsUpdate();
    
    scoreUpdate();
    
    levelLabelUpdate();
    
    levelStatusUpdate();
    
    setupCollisionHandling();
    
    
    
}

///---------------------------------------------------------------------------------
void GameScene::destroyGameData()
{
	TESTLOGFLIGHT("GameScene::destroyGameData()");
	
    params::getInstance()->saveAll();
    
    stageClearCollision();
    
	BonusItem::destroyAllItems();
    
    bool currentIsInPool = AliensManager::getInstance()->isInPool(currentAlien);
    
    AliensManager::getInstance()->removeAllSprite();
    
    if( currentAlien && !currentIsInPool)
    {
        TESTLOGFLIGHT("REMOVE NOT PHYSIC currentAlien = %i",currentAlien);
        AliensManager::getInstance()->removeAlien(currentAlien);
        
    }
    currentAlien = NULL;

    
    if (prevBackingAlien) {
		AliensManager::getInstance()->removeAlien(prevBackingAlien);
		prevBackingAlien = NULL;
        
    }

    if (backingAlien) {
        TESTLOGFLIGHT("REMOVE currentAlien = %i",currentAlien);
        
		AliensManager::getInstance()->removeAlien(backingAlien);
		backingAlien = NULL;
        
    }

    
    if (fallStatus) {
		fallStatus->removeSelf();
		fallStatus = NULL;
    }

    
    if( nextFigureAlien )
    {
		AliensManager::getInstance()->removeAlien(nextFigureAlien);
		nextFigureAlien = NULL;
        
    }
    
    
    
    
}
// save prev game data
void GameScene::endOfPrevGame()
{
    params * prs = params::getInstance();
    isHiScore   = false;
    isHiLevel   = false;
    isHiCoins   = false;
    isHiFigureCleared   = false;
    
    
    if (score > prs->hiScore) {
        isHiScore = true;
        prs->hiScore = score;
    }
    
    if (LevelLoader::getInstance()->curStageNumber > prs->hiLevelRecord) {
        prs->hiLevelRecord = LevelLoader::getInstance()->curStageNumber;
        isHiLevel = true;
    }
    
    if (coins > prs->hiCoinsPerLevel) {
        isHiCoins = true;
        prs->hiCoinsPerLevel = coins;
    }

    if (figureCleared > prs->hiFiguresClearedPerLevel) {
        isHiFigureCleared = true;
        prs->hiFiguresClearedPerLevel = figureCleared;
    }

    
    
    prs->saveAll();
    //
    PlayEvents::getInstance()->onSaveAll();
    
}


///---------------------------------------------------------------------------------
// смерть игрока
void GameScene::gameOver()
{
	TESTLOG("GameScene::gameOver()");
	isGameOver = true;
    
    endOfPrevGame(); //save all scores
    
    PlayEvents::getInstance()->onGameOver();
    
    gameOverSprite->setVisible(true);
    gameOverSprite->playAnimation();

    

    /// redirect to menu
	/// need to save all scores and moneys
}
///---------------------------------------------------------------------------------
void GameScene::gameOverAnimHasEnded(CCObject * object)
{
    setPause();
    
    if (UserRating::getInstance()->completedTasks.size() > 0) {
        UserRating::getInstance()->onEndGame(loader);
        UserRating::getInstance()->showRatingFrom = 0;
        
    }else{
        gameoverMenu->showMenu(0.2);
        pauseButton->setEnabled(false);
    }
}
///---------------------------------------------------------------------------------
void GameScene::createMouseJoint(b2Vec2 locationWorld)
{
	TESTLOG("GameScene::createMouseJoint");

	b2MouseJointDef md;
	if(!currentAlien){
		TESTLOG("GameScene::createMouseJoint NO SPRITE ");
		return;
	}

	if(!currentAlien->getBody()){
		//TESTLOG("GameScene::createMouseJoint NO BODY FOR SPRITE %s", currentSprite->getUniqueName().c_str());
		return;
	}
	LHBezier * bounds = loader->bezierWithUniqueName("bounds");
	md.bodyA =  bounds->getBody();//loader->leftPhysicBoundary();
	md.bodyB = currentAlien->getBody();
	//currentSprite->getBody()->SetType(b2_dynamicBody);
	md.target = locationWorld;
	md.collideConnected = true;
	md.maxForce = 400.0f * currentAlien->getBody()->GetMass();
	mouseJoint = (b2MouseJoint *)world->CreateJoint(&md);
	currentAlien->getBody()->SetAwake(true);
}
////score points
///---------------------------------------------------------------------------------
void GameScene::scoreHit(int points)
{
	TESTLOG("GameScene::scoreHit(int points)");
	
    score += (points * CosmoMeter::getInstance()->getMultiplier());
    LevelLoader::getInstance()->addPoints( points );
    scoreUpdate();
    
    PlayEvents::getInstance()->onScorePoint(points);
}
///---------------------------------------------------------------------------------
void GameScene::scoreHitAtPosition(CCPoint position, int points, float delay, int figureColor)
{    
	TESTLOG("GameScene::scoreHitAtPosition(CCPoint position, int points)");

    int realPoints = points;
    int fontSize = fontSizeFloatScore;
    ccColor3B color = FLOAT_POINTS_COLOR;
    int levelNumber = 1;
    if( LevelLoader::getInstance() ){
        levelNumber = LevelLoader::getInstance()->curStageNumber;
    }
    
    int mult = CosmoMeter::getInstance()->getMultiplier();
    if (comboCount>0) {
        mult = mult * comboCount;
    }
    
	if( points < 49 ){
		if( (points < MIN_COLLIDED_CLEAR) && (points >= 0)){
			realPoints = 5 * mult ;// 20;
		}else if( points == MIN_COLLIDED_CLEAR ){
			realPoints = 10 * mult; //30;
		}else if( points == MIN_COLLIDED_CLEAR + 1){
            fontSize    = fontSizeFloatScore * 1.1;
            color       = FLOAT_POINTS_COLOR1;
			realPoints = 15 * mult; //50;
		}else if( points == MIN_COLLIDED_CLEAR + 2){
			realPoints = 20 * mult;//;
            fontSize    = fontSizeFloatScore * 1.2;
            color       = FLOAT_POINTS_COLOR2;
            
		}else if(points == MIN_COLLIDED_CLEAR + 3) {
			realPoints = 30 * mult;
            fontSize    = fontSizeFloatScore * 1.3;
            color       = FLOAT_POINTS_COLOR3;
            
		}else if(points == MIN_COLLIDED_CLEAR + 4) {
			realPoints = 35 * mult;
            fontSize    = fontSizeFloatScore * 1.4;
            color       = FLOAT_POINTS_COLOR3;
            
		}else if(points >= MIN_COLLIDED_CLEAR + 5) {
			realPoints = 40 * mult;
            fontSize    = fontSizeFloatScore * 1.5;
            color       = FLOAT_POINTS_COLOR3;
            
		}else if (points == -10) { //combo2x
            realPoints = 500 * levelNumber * mult;
            fontSize    = fontSizeFloatScore * 2;
            color       = COMBO_COLOR2;

        }else if (points == -11) { //combo2x
            realPoints = 1000 * levelNumber * mult;
            fontSize    = fontSizeFloatScore * 2.2;
            color       = COMBO_COLOR3;
            
        }else if (points == -12) { //combo2x
            realPoints = 2000 * levelNumber * mult;
            fontSize    = fontSizeFloatScore * 2.4;
            color       = COMBO_COLOR4;
            
        }else if (points == -13) { //combo2x
            realPoints = 5000 * levelNumber * mult;
            fontSize    = fontSizeFloatScore * 3;
            color       = COMBO_COLOR5;
            
        }else if (points == -14) { //combo2x
            realPoints = 10000 * levelNumber * mult;
            fontSize    = fontSizeFloatScore * 3 ;
            color       = COMBO_COLOR6;
        }
	}else{
        realPoints = realPoints * mult;
        
		if((realPoints > 100) && (realPoints < 1000)){
			color       = FLOAT_POINTS_COLOR1;
		}else if((realPoints > 1000) && (realPoints < 10000)){
			color       = FLOAT_POINTS_COLOR2;
		}else if((realPoints > 10000) && (realPoints < 100000)){
			color       = FLOAT_POINTS_COLOR3;
		}
	}
    
    
	score += realPoints;
    LevelLoader::getInstance()->addPoints( realPoints );
    scoreUpdate();

    PlayEvents::getInstance()->onScorePoint(realPoints);

    if(position.x!=0 && position.y!=0) {
        scoreFlyCreate(position, realPoints, delay, color,figureColor);
    }
}
///---------------------------------------------------------------------------------
void GameScene::removeScoreText(CCNode * node)
{
	TESTLOG("GameScene::removeScoreText: remove node %i", node->getTag());

    LHSprite * sprite = (LHSprite *) node;
    if (sprite) {
		TESTLOG("GameScene::removeScoreText: remove sprite %s", sprite->getUniqueName().c_str());
		sprite->removeSelf();
		sprite = NULL;
    }
}


///----------------------------------------
// CONTROL 
//-----------------------------------------
///---------------------------------------------------------------------------------
/// управление нажатием
void GameScene::ccTouchesBegan(cocos2d::CCSet* touches, cocos2d::CCEvent* event)
{
    // check shop
    if (Shop::getInstance()->shopIsActive()) {
        CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
        
                Shop::getInstance()->ccTouchBegan(touch,event);
            }
        }
        return;
    }
    
	if( isGameOver )
		return;

    if (!isPlayingNow()) {
        return;
    }

    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );

            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );

            if (CosmoBonuses::getInstance()->checkTouch(location)) {
                return;
            }
            
            if (AliensManager::getInstance()->checkTouchToKill(location)) {
                return;
            }
            
            // проверяем на нажатие кнопки
            if (ButtonManager::getInstance()->touchButton(location)) {
                return;
            }

            
            BonusItem * item = BonusItem::checkTouch(location);
            if ( item != NULL) {
                item->useBonus(location);
                return;
            }
			
			b2Vec2 locationWorld = LevelHelperLoader::pointsToMeters( location ); //b2Vec2(location.x/PTM_RATIO, location.y/PTM_RATIO);
			
			if( currentAlien==NULL ) return;
			if( currentAlien->getBody() == NULL ) return;
			locationWorld.y =  currentAlien->getBody()->GetPosition().y;

			//// save fast fall action
            if ((currentAlien!=NULL) && (stateFigure == STATE_FIGURE_CONTROL)) {
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
        }
    }

}
///---------------------------------------------------------------------------------
//// control
void GameScene::ccTouchesMoved(cocos2d::CCSet* touches, cocos2d::CCEvent* event)
{
    
    // check shop
    if (Shop::getInstance()->shopIsActive()) {
        CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
                
                Shop::getInstance()->ccTouchMoved(touch,event);
            }
        }
        return;
    }
    
	if( isGameOver )
		return;
    
    if (!isPlayingNow()) {
        return;
    }
    
    
		CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
                            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );
                // проверяем на нажатие кнопки
                if (ButtonManager::getInstance()->touchButton(location)) {
                    return;
                }

                
				b2Vec2 locationWorld = LevelHelperLoader::pointsToMeters( location ); 

				if( currentAlien==NULL ) return;
				if( currentAlien->getBody() == NULL ) return;
				locationWorld.y =  currentAlien->getBody()->GetPosition().y;

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
            }
        }
}
///---------------------------------------------------------------------------------
void GameScene::ccTouchesEnded(CCSet* touches, CCEvent* event)
{
    // check shop
    if (Shop::getInstance()->shopIsActive()) {
        CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
                
                Shop::getInstance()->ccTouchEnded(touch,event);
            }
        }
        return;
    }
    
    if (!isPlayingNow()) {
        return;
    }

    
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );

            if (touchFastFallDown == touch ) {
                if (fastFallDown) {
                    figureMakeDynamic();
                    
                    //TEST
                    //NEED TO REMOVE IN RELEASE
                    PlayEvents::getInstance()->onTest();
                    
                    // TUTORIAL
                    if (isTutorial(2)) {
                        if (tutorialStep == TUTORIAL_SHOWING) {
                            tutorialStepDone = true;
                        }
                    }
                    
                }
                fastFallDown        = false;
                fastFallDownCounter = 0;
                touchFastFallDown   = NULL;
            }

			if (mouseJoint) {
				world->DestroyJoint(mouseJoint);
				mouseJoint = NULL;
                
                // TUTORIAL
                if (isTutorial(1)) {
                    if (tutorialStep == TUTORIAL_SHOWING) {
                        tutorialStepDone = true;
                    }
                }
			}

			if(stateFigure == STATE_FIGURE_CONTROL){
				if(currentAlien){
					if(currentAlien->getBody())
						currentAlien->getBody()->SetLinearVelocity(b2Vec2(0,0));
				}
			}

            if ( touchMoveRotate == touch)
                touchMoveRotate = NULL;
        }
    }
}
///---------------------------------------------------------------------------------
void GameScene::ccTouchesCancelled(cocos2d::CCSet* touches, cocos2d::CCEvent* event)
{
    /*if (!isPlayingNow()) {
        return;
    }
*/
    
    // check shop
    if (Shop::getInstance()->shopIsActive()) {
        CCSetIterator it;
        for( it = touches->begin(); it != touches->end(); ++it){
            if (*it){
                CCTouch* touch = (CCTouch*)( *it );
                
                Shop::getInstance()->ccTouchCancelled(touch,event);
            }
        }
        return;
    }
    
    
    CCSetIterator it;
    for( it = touches->begin(); it != touches->end(); ++it){
        if (*it){
            CCTouch* touch = (CCTouch*)( *it );
            CCPoint location = CCDirector::sharedDirector()->convertToGL( touch->getLocationInView() );


			if (mouseJoint) {
				world->DestroyJoint(mouseJoint);
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
///---------------------------------------------------------------------------------
CCRect GameScene::boundBoxFromSprite(LHSprite * sprite)
{
	//TESTLOG("GameScene::boundBoxFromSprite(LHSprite * sprite)");
    
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
///---------------------------------------------------------------------------------
void GameScene::preNewStage()
{
	TESTLOG("GameScene::preNewStage()");

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
        
        nextLevelSprite->setScale(2.0);
        nextLevelSprite->runAction(CCSequence::create(scale1,move1,scale2,funcAction,NULL));
        nextLevelSprite->runAction(CCSequence::create(move3,fade1,NULL));         
    }
    
    scoreHitAtPosition(additionalPoint, additionalPoints);
    
    
}
///---------------------------------------------------------------------------------
void GameScene::afterNewStage()
{
	TESTLOG("GameScene::afterNewStage()");
    levelLabelUpdate();
    fallFiguresAfterNewStage();
    
    PlayEvents::getInstance()->onReachLevel(LevelLoader::getInstance()->curStageNumber);
}
///---------------------------------------------------------------------------------
void GameScene::fallStatusStart()
{
	/// TEMP 
	//return;
	/// TEMP 

    if (aimLeft && aimRight) {
        aimLeft->setVisible(true);
        aimLeft->setOpacity(0);
        //aimLeft->runAction(Effect::FadeInOut(0.8,200.0,100.0));
        aimLeft->runAction(Effect::Fade(0.3,200.0));

        aimRight->setVisible(true);
        aimRight->setOpacity(0);
        //aimRight->runAction(Effect::FadeInOut(0.8,200.0,100.0));
        aimRight->runAction(Effect::Fade(0.3,200.0));

        
        
        
    }
    
    
	TESTLOG("GameScene::fallStatusStart()");
    if (!fallStatus) {
        fallStatus = LHSprite::spriteWithName("fallStatus0001", "types", "types.pshs");
        //fallStatus = loader->createBatchSpriteWithUniqueName("fallStatus0001");
        fallStatus->setOpacity(200);
        fallStatus->prepareAnimationNamed("fallStatus", "types.pshs");
        fallStatus->setFrame( 0 );
        LHLayer * mLayer = Game::getLoader()->layerWithUniqueName("MAIN_LAYER");
        LHBatch * batch = mLayer->batchWithUniqueName("types");
        batch->addChild( fallStatus );
    }
    if (!fallStatus) {
        return;
    }
	//fallStatus->prepareAnimationNamed("statusEmpty","status.pshs");
	//fallStatus->playAnimation();

	if (currentAlien) {
        if (stateFigure == STATE_FIGURE_CONTROL) {
			CCRect figureRect   = currentAlien->getSprite()->boundingBox();
            CCPoint figurePos   = currentAlien->getSprite()->getPosition();
            figurePos.y = figureRect.origin.y + figureRect.size.height + fallStatus->boundingBox().size.height/2 + 2;
            fallStatus->setPosition( figurePos );
            fallStatus->setFrame(fallStatus->numberOfFrames() - 1 );
			//fallStatus->prepareAnimationNamed("status90","status.pshs");
			//fallStatus->playAnimation();
            
            figurePos   = currentAlien->getSprite()->getPosition();
            figurePos.x = figurePos.x - figureRect.size.width/2;
            figurePos.y = figurePos.y - figureRect.size.height/2;
            aimLeft->setPosition(figurePos);

            figurePos   = currentAlien->getSprite()->getPosition();
            figurePos.x = figurePos.x + figureRect.size.width/2;
            figurePos.y = figurePos.y - figureRect.size.height/2;
            aimRight->setPosition(figurePos);
            
            //figurePos.y = figureRect.origin.y + figureRect.size.height + fallStatus->boundingBox().size.height/2 + 2;
            

        }
    }
}
///---------------------------------------------------------------------------------
void GameScene::fallStatusEnd()
{
	/// TEMP 
	//return;
	/// TEMP 

	TESTLOG("GameScene::fallStatusEnd()");
    if (!fallStatus) {
        return;
    }
    
    fallStatus->setFrame( 0 );
    
    
    if (aimLeft && aimRight) {
        //aimLeft->setOpacity(255);
        aimLeft->stopAllActions();
        aimLeft->runAction(Effect::Fade(0.3, 0));
        aimRight->stopAllActions();
        //aimRight->setOpacity(255);
        aimRight->runAction(Effect::Fade(0.3, 0));
    }

    //fallStatus->startAnimationNamed("statusEmpty");
	//fallStatus->prepareAnimationNamed("statusEmpty","status.pshs");
	//fallStatus->playAnimation();

    
}
///---------------------------------------------------------------------------------
void GameScene::fallStatusUpdate(float percent)
{
	/// TEMP 
	//return;
	/// TEMP 

	//TESTLOG("GameScene::fallStatusUpdate(float percent)");

    if (!fallStatus) {
        return;
    }
    //static string lastAnimation = "";
    //string animationName = "statusEmpty";

    static int lastFrame = -1;
    int frame = -1;
    
    if (currentAlien) {
        if (stateFigure == STATE_FIGURE_CONTROL) {
			CCRect figureRect   = currentAlien->getSprite()->boundingBox();
            CCPoint figurePos   = currentAlien->getSprite()->getPosition();
            figurePos.y = figureRect.origin.y + figureRect.size.height + fallStatus->boundingBox().size.height/2 + 2;
            fallStatus->setPosition( figurePos );
            
            int maxFrame = fallStatus->numberOfFrames() - 2;
            frame = (int)((maxFrame * percent)/100) + 2;
            if( fallStatus->currentFrame() != frame ){
                
                fallStatus->setFrame(frame);
            }
            
            if (aimLeft && aimRight) {
                figurePos   = currentAlien->getSprite()->getPosition();
                figurePos.x = figurePos.x - figureRect.size.width/2;
                figurePos.y = figurePos.y - figureRect.size.height/2;
                aimLeft->setPosition(figurePos);
                
                figurePos   = currentAlien->getSprite()->getPosition();
                figurePos.x = figurePos.x + figureRect.size.width/2;
                figurePos.y = figurePos.y - figureRect.size.height/2;
                aimRight->setPosition(figurePos);
            }
            
            
        }
    }
    lastFrame = frame;
    //lastAnimation = animationName;
}
///---------------------------------------------------------------------------------
void GameScene::fallRandomFigures()
{
	TESTLOG("GameScene::fallRandomFigures()");

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
            std::vector<Alien *> aliens;
            
			for(int i=0; i < fallCount; i++ ){
				Figure * figure = stage->randomFigure();
				index = CCRANDOM_0_1() * indeces.size();
				if((index > 0) && (index < indeces.size())){
					pntIndex = indeces[index];
					indeces.erase( indeces.begin() + index );
				}
				/// create figure this
				Alien * alien = AliensManager::getInstance()->createPhysicsAlien( figure );
                float angle = stage->rotationAngle * 2;
				float rndFigureAngle = CCRANDOM_0_1() * angle - (angle / 2);
				alien->getSprite()->transformPosition( respawnPoints[pntIndex] );
                alien->getSprite()->transformRotation( rndFigureAngle );
                alien->animFigure( ANIM_STATE_NORMAL );
                
                alien->fallingBonus( CCRANDOM_0_1() + 1.5, LevelLoader::getInstance()->curStageNumber * 100 );
                aliens.push_back(alien);
                
			}///for
            
            PlayEvents::getInstance()->onFallBonus(aliens);
            PlayEvents::getInstance()->onFallingFigures(aliens);
            
            aliens.clear();
		}
	}

}
///---------------------------------------------------------------------------------
void GameScene::fallFiguresAfterNewStage()
{
	TESTLOG("GameScene::fallRandomFigures()");
    int maxCount = respawnPoints.size();
	int fallCount = maxCount;
    
    int figuresOnStage = AliensManager::getInstance()->physicsAliens.size();
    Stage * stage = LevelLoader::getInstance()->getCurStage();
    fallCount = stage->minFigures - figuresOnStage;
    
    if (fallCount > maxCount) {
        fallCount = maxCount;
    }
    
	if( (fallCount > 0) && (fallCount <= respawnPoints.size()) ){
		/// fall of random figures
		vector<int> indeces;
		for(int i=0; i < respawnPoints.size(); i++){
			indeces.push_back( i );
		}
        
		int index = 0;
		int pntIndex = 0;
		if(stage){
            std::vector<Alien *> aliens;
            
			for(int i=0; i < fallCount; i++ ){
				Figure * figure = stage->randomFigure();
				index = CCRANDOM_0_1() * indeces.size();
				if((index > 0) && (index < indeces.size())){
					pntIndex = indeces[index];
					indeces.erase( indeces.begin() + index );
				}
				/// create figure this
				Alien * alien = AliensManager::getInstance()->createPhysicsAlien( figure );
                float angle = stage->rotationAngle * 2;
				float rndFigureAngle = CCRANDOM_0_1() * angle - (angle / 2);
				alien->getSprite()->transformPosition( respawnPoints[pntIndex] );
                alien->getSprite()->transformRotation( rndFigureAngle );
                alien->animFigure( ANIM_STATE_NORMAL );
                alien->fallingBonus( CCRANDOM_0_1() + 1.5, LevelLoader::getInstance()->curStageNumber * 100 );
                aliens.push_back(alien);
			}///for
            PlayEvents::getInstance()->onFallingFigures(aliens);
            
            aliens.clear();
		}
	}
    
}


///---------------------------------------------------------------------------------
void GameScene::fallOfFigureEnd(CCNode * node){
    TESTLOG("GameScene::fallOfFigureEnd");
	fallingCount--;
	if(fallingCount == 0){
		figureCreateNew();
	}
}

bool GameScene::isPlayingNow()
{
    if (gameState == GAMESTATE_PLAY) {
        return true;
    }
    return false;
}

void  GameScene::startMainMenu()
{
    gameState = GAMESTATE_MAINMENU;
    
    setPosition(camPntMainMenu->cameraPosition);
    PlayEvents::getInstance()->onShowMainMenu();
    
    
}
void  GameScene::startPlay()
{
    if (gameState == GAMESTATE_MAINMENU) {

        runAction(
            CCSequence::create(
                CCEaseExponentialOut::create(CCMoveTo::create(0.5, camPntPlay->cameraPosition)),
                NULL
                )
            );
    
    }else{
        setPosition(camPntPlay->cameraPosition);
    }
    gameState = GAMESTATE_PLAY;
    restartGame();
    
    
    
}
void  GameScene::setPause()
{
    TESTLOGFLIGHT("GameScene::setPause()");
    pauseChildren(Game::getGameLayer());

    gameState = GAMESTATE_PAUSEMENU;
    
    
}
void  GameScene::resumePlay()
{
    TESTLOGFLIGHT("GameScene::resumePlay()");
    resumeChildren(Game::getGameLayer());

    gameState = GAMESTATE_PLAY;

    PlayEvents::getInstance()->onResumePlay();
}

void GameScene::pauseChildren(CCNode * node)
{
    node->pauseSchedulerAndActions();
    CCObject * object;
    
    CCARRAY_FOREACH(node->getChildren(), object )
    {
        CCDirector::sharedDirector()->getActionManager()->pauseTarget(object);
        pauseChildren((CCNode *) object);
    }
}
void GameScene::resumeChildren(CCNode * node)
{
    node->resumeSchedulerAndActions();
    CCObject * object;
    
    CCARRAY_FOREACH(node->getChildren(), object )
    {
        CCDirector::sharedDirector()->getActionManager()->resumeTarget(object);
        resumeChildren((CCNode *) object);
    }
}

///---------------------------------------------------------------------------------
/*
void GameScene::touchBeginOnSprite(CCObject* cinfo)
{
	TESTLOG("GameScene::touchBeginOnSprite(CCObject* cinfo)");

    LHTouchInfo* info = (LHTouchInfo*)cinfo;
    LHSprite * sp = info->sprite;
    if (sp) {
        if (sp->getUniqueName() == "megabomb") {

			restartGame();

        }
    }

}
///---------------------------------------------------------------------------------
void GameScene::touchMovedOnSprite(CCObject* cinfo)
{
    
}
///---------------------------------------------------------------------------------
void GameScene::touchEndedOnSprite(CCObject* cinfo)
{
    
}
*/
///---------------------------------------------------------------------------------
