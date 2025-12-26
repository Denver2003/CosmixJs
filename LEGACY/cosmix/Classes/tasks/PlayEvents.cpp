//
//  PlayEvents.cpp
//  cosmix
//
//  Created by denver on 05.09.13.
//
//

#include "cocos-ext.h"
#include "PlayEvents.h"
#include "TaskManager.h"
#include "GameScene.h"
#include "Tasks.h"
#include "FlyTask.h"
#include "CosmoMeter.h"
#include "UserRating.h"
#include "CosmoBonuses.h"
#include "shop.h"
#include "params.h"
#include "sounds.h"
#include "Test.h"


PlayEvents * PlayEvents::mInstance = NULL;

void PlayEvents::sendStatistics()
{
  /*  TESTLOG("figuresCleared=%i; burstBubbles=%i;figuresFallenBonus=%i;maxFiguresCleared=%i;megaComboCount=%i;superComboCount=%i;cosmoComboCount=%i;coinsCount=%i;scoreWithoutBonus=%i;scoreWithBonus=%i;grenadeFigures=%i;",
          figuresCleared,          burstBubbles,          figuresFallenBonus,          maxFiguresCleared,          megaComboCount,
          superComboCount,          cosmoComboCount,          coinsCount,          scoreWithoutBonus,          scoreWithBonus,
          grenadeFigures
          );
    */
    cocos2d::extension::CCHttpRequest* request = new cocos2d::extension::CCHttpRequest();
    request->setUrl("http://www.cosmix.bl.ee/php/csmServer/index.php");
    request->setRequestType(cocos2d::extension::CCHttpRequest::kHttpPost);
    //request->setResponseCallback(this, httpresponse_selector(HttpClientTest::onHttpRequestCompleted));
    
    float deltaTime = calcGameplayInterval();
    //TESTLOG("%f",deltaTime);
    int iGameDuration = (int)deltaTime;
//
//    LevelLoader::getInstance()->curStageNumber;
/*    Shop::getInstance()->getByName("coins")->currentIndex();
    Shop::getInstance()->getByName("bonuses")->currentIndex();
    Shop::getInstance()->getByName("grenades")->currentIndex();
    Shop::getInstance()->getByName("cosmometer")->currentIndex();
 */
    params * pr = params::getInstance();

    //pr->hiScore
    //pr->totalCoins
    // write the post data
    char postData[1000];
    sprintf(postData, "figuresCleared=%i&burstBubbles=%i&figuresFallenBonus=%i&maxFiguresCleared=%i&megaComboCount=%i&superComboCount=%i&cosmoComboCount=%i&coinsCount=%i&scoreWithoutBonus=%i&scoreWithBonus=%i&grenadeFigures=%i&level=%i&upgrade1=%i&upgrade2=%i&upgrade3=%i&upgrade4=%i&duration=%i&hiScore=%i&totalCoins=%i"
            ,figuresCleared,          burstBubbles,          figuresFallenBonus,          maxFiguresCleared,          megaComboCount,
            superComboCount,          cosmoComboCount,          coinsCount,          scoreWithoutBonus,          scoreWithBonus,
            grenadeFigures,LevelLoader::getInstance()->curStageNumber,
            Shop::getInstance()->getByName("coins")->currentIndex(),
            Shop::getInstance()->getByName("bonuses")->currentIndex(),
            Shop::getInstance()->getByName("grenades")->currentIndex(),
            Shop::getInstance()->getByName("cosmometer")->currentIndex(),
            iGameDuration,
            pr->hiScore,
            pr->totalCoins
            );
    request->setRequestData(postData, strlen(postData));

    //request->setTag("POST test1");
    cocos2d::extension::CCHttpClient::getInstance()->send(request);
    request->release();
    
}

void PlayEvents::initGameplayInterval()
{

    if (CCTime::gettimeofdayCocos2d(&gameTime, NULL) != 0)
    {
        TESTLOG("error in gettimeofday");
        return;
    }
    
}
float PlayEvents::calcGameplayInterval()
{
    struct cc_timeval now;
    
    if (CCTime::gettimeofdayCocos2d(&now, NULL) != 0)
    {
        TESTLOG("error in gettimeofday");
        
        return -1.0f;
    }
    
    return (now.tv_sec - gameTime.tv_sec) + (now.tv_usec - gameTime.tv_usec) / 1000000.0f;

}
//-------GAME-EVENTS-----------
//PlayEvents::GetInstance()->
void PlayEvents::onStartGame()
{
    TESTLOGFLIGHT("PlayEvents::onStartGame()");
    UserRating::getInstance()->onBeginGame();
    CosmoBonuses::getInstance()->onStartGame();
    
    ///
    figuresCleared = 0;
    burstBubbles = 0;
    figuresFallenBonus = 0;
    maxFiguresCleared = 0;
    megaComboCount = 0;
    superComboCount = 0;
    cosmoComboCount = 0;
    coinsCount = 0 ;
    scoreWithoutBonus = 0;
    scoreWithBonus = 0;
    grenadeFigures=0;
    initGameplayInterval();
    ///
    Test::getInstance()->Checkpoint("New Game Started...");
    
}
void PlayEvents::onGameOver()
{
    TESTLOGFLIGHT("PlayEvents::onGameOver()");
    
    Test::getInstance()->Checkpoint("Game Over...");
    
    CTaskToReachLevelNoOneFigureCleared::complete();
    CTaskToEndGameInLevel::gameOver();
    CosmoBonuses::getInstance()->onEndGame();
    
    
    CTaskManager::getInstance()->saveCurrentTasksOnGameOver();
    //saveCurrentTasksOnGameOver
    sendStatistics();

    
}
void PlayEvents::onReachLevel(int level)
{
    Test::getInstance()->Checkpoint("Reach Level");
    
    CTaskToReachLevel::completeLevel();
    CTaskToReachLevelWithoutGrenade::completeLevel();
    CTaskToReachLevelWithoutCoins::completeLevel();
    CTaskToCompleteLevelOnlyOneColorCleared::completeLevel();
    CTaskToEndGameInLevel::completeLevel();
    CTaskToReachLevelNoOneBubbleBursted::completeLevel();
    CTaskToReachLevelWithoutCombos::completeLevel();
    
    sound::getInstance()->playFirstSound("new_level");

}
void PlayEvents::onScorePoint(int point)
{
    CTaskToScorePoints::addPoints(point);
    CTaskToScorePointsNoReach2X::addPoints(point);
    CTaskToScorePointsNoReach3X::addPoints(point);
    CTaskToScorePointsWithoutBonus::addPoints(point);
    
    scoreWithoutBonus+=point;
}

void PlayEvents::onTouchBubble(BonusItem * bonusItem)
{
    CTaskToBurstBubbles::burstBubble();
    CTaskToReachLevelNoOneBubbleBursted::failed();
    
    //tutorials
    if (GameScene::gameScene->isTutorial(4)) {
        if (GameScene::gameScene->tutorialStep == TUTORIAL_CLOSED) {
            GameScene::gameScene->tutorial4->hideMenu(0);
            GameScene::gameScene->tutorialCount   = 5;
            GameScene::gameScene->tutorialStep    = TUTORIAL_NEED_TO_SHOW;
            GameScene::gameScene->hideTutorial    = false;
            GameScene::gameScene->tutorialStepDone= false;
            GameScene::gameScene->timeToNextTutorial = 0;
            
            //tutorial complete
            CTaskToLearn::tutorialComplete();
        }
    }
    
    burstBubbles++;
}
void PlayEvents::onCreateBubble(BonusItem * bonusItem)
{

}
void PlayEvents::onCreateFigure(Alien * alien)
{
    CosmoMeter::getInstance()->moveUp(1);
}
void PlayEvents::onStartControlFigure(Alien * alien)
{

}
void PlayEvents::onClearFigure(Alien * alien)
{
    CTaskToReachLevelNoOneFigureCleared::failed();
    CTaskToCompleteLevelOnlyOneColorCleared::clearColor(alien->figure->color_index);
    CTaskToClearFiguresDuringTime::clearFigure();

    CTaskToClearFiguresSameColorInRow::clearFigure(alien->figure->color_index);
    CTaskToClearFiguresOfColorInTime::clearFigure(alien->figure->color_index);
    CTaskToClearFiguresOfColor::clearFigure(alien->figure->color_index);
    

    figuresCleared++;
    
}
void PlayEvents::onClearFigures(int countFigures)
{
    CTaskToClearFigures::clearFigures(countFigures);
    CTaskToClearFiguresForOneTime::clearFigures(countFigures);
    
    //tutorials
    if (GameScene::gameScene->isTutorial(3)) {
        if (GameScene::gameScene->tutorialStep == TUTORIAL_CLOSED) {
            GameScene::gameScene->tutorial3->hideMenu(0);
            GameScene::gameScene->tutorialCount   = 4;
            GameScene::gameScene->tutorialStep    = TUTORIAL_NEED_TO_SHOW;
            GameScene::gameScene->hideTutorial    = false;
            GameScene::gameScene->tutorialStepDone= false;
            GameScene::gameScene->timeToNextTutorial = 0;
        }
    }
    
    maxFiguresCleared = maxFiguresCleared<countFigures?countFigures:maxFiguresCleared;
    
    sound::getInstance()->playRandomSound("figure_bang");
}
void PlayEvents::onGetCoin(int coins)
{
    CTaskToReachLevelWithoutCoins::failed();
    CTaskToGetCoins::collectCoins(coins);
    
    coinsCount+=coins;
    
    sound::getInstance()->playFirstSound("coin_pick_up");
}
void PlayEvents::onGetPointBonus(int points, int type)
{
    CTaskToScorePointsWithBonus::addPoints(points);
    CTaskToScorePointsWithoutBonus::failed();
    
    scoreWithBonus+=points;
    
}
void PlayEvents::onUseGrenade(int color, int count)
{
    CTaskToReachLevelWithoutGrenade::failed();
    CTaskToExplodeFiguresWithGrenade::explode(count);
    
    grenadeFigures+=count;
    
    sound::getInstance()->playFirstSound("grenade");
    
}
void PlayEvents::onFallBonus(std::vector<Alien *> aliens )
{
    CTaskToFallFiguresWithFallenBonus::fallFigures(aliens.size());
    CTaskToReachCosmometer2XWithoutFall::failed();
    CTaskToReachCosmometer3XWithoutFall::failed();
    CTaskToReachCosmometer5XWithoutFall::failed();
    
    figuresFallenBonus+=aliens.size();
}
void PlayEvents::onFallingFigures(std::vector<Alien *> aliens )
{
    for (int i = 0; i < aliens.size(); i++) {
        PlayEvents::onCreateFigure(aliens[i]);
    }

    sound::getInstance()->playFirstSound("fall_figures");
}
void PlayEvents::onCombo2x(void)
{
    CTaskToReachLevelWithoutCombos::failed();

    sound::getInstance()->playFirstSound("combo");
}
void PlayEvents::onCombo3x(void)
{
    sound::getInstance()->playFirstSound("combo");
}
void PlayEvents::onSuperCombo(void)
{
    CTaskToMakeSuperCombo::combo();
    superComboCount++;
    
    sound::getInstance()->playFirstSound("super_combo");
}
void PlayEvents::onMegaCombo(void)
{
    CTaskToMakeMegaCombo::combo();
    megaComboCount++;
    
    sound::getInstance()->playFirstSound("mega_combo");
}
void PlayEvents::onCosmoCombo(void)
{
    CTaskToMakeCosmoCombo::combo();
    Bonus::startMegaBonus();
    
    cosmoComboCount++;
    
    sound::getInstance()->playFirstSound("cosmo_combo");
}

void PlayEvents::onUseTouchToKillBonus(void)
{
    CTaskToUseTouchToKillBonus::useBonus();
    TESTCHECKPOINT("Touch To Kill Use");

    sound::getInstance()->playFirstSound("touch_to_kill");
}
void PlayEvents::onUseGunBonus(void)
{
    CTaskToUseGunBonus::useBonus();
    TESTCHECKPOINT("Gun Use");
    
    sound::getInstance()->playFirstSound("cosmogun");
}
void PlayEvents::onUseCosmoBombBonus(void)
{
    CTaskToUseCosmobombBonus::useBonus();
}

void PlayEvents::onPickUpTouchToKillBonus(void)
{
  //  CTaskToUseTouchToKillBonus::useBonus();
        TESTCHECKPOINT("Touch To Kill Pick Up");
}
void PlayEvents::onPickUpGunBonus(void)
{
//    CTaskToUseGunBonus::useBonus();
        TESTCHECKPOINT("Gun Pick Up");
}
void PlayEvents::onPickUpCosmoBombBonus(void)
{
    //CTaskToUseCosmobombBonus::useBonus();
}


void PlayEvents::onUpCosmoMeter2xPoint(void)
{
    CTaskToHoldCosmometerUpTo2x::onUp2x();
    CTaskToReachCosmometer2X::complete();
    CTaskToReachCosmometer2XWithoutFall::complete();
    CTaskToScorePointsNoReach2X::failed();
    
    sound::getInstance()->playFirstSound("cosmometer_2x");
}
void PlayEvents::onDownCosmoMeter2xPoint(void)
{
    CTaskToHoldCosmometerUpTo2x::onDown2x();
}
void PlayEvents::onUpCosmoMeter3xPoint(void)
{
    CTaskToHoldCosmometerUpTo3x::onUp3x();
    CTaskToReachCosmometer3X::complete();
    CTaskToReachCosmometer3XWithoutFall::complete();
    CTaskToScorePointsNoReach3X::failed();
    
    sound::getInstance()->playFirstSound("cosmometer_3x");
    
}
void PlayEvents::onDownCosmoMeter3xPoint(void)
{
    CTaskToHoldCosmometerUpTo3x::onDown3x();
}
void PlayEvents::onUpCosmoMeter5xPoint(void)
{
    CTaskToHoldCosmometerUpTo5x::onUp5x();
    CTaskToReachCosmometer5X::complete();
    CTaskToReachCosmometer5XWithoutFall::complete();
    
    TESTCHECKPOINT("CosmoMeter5x POINT");
    
    sound::getInstance()->playFirstSound("cosmometer_5x");
}
void PlayEvents::onDownCosmoMeter5xPoint(void)
{
    CTaskToHoldCosmometerUpTo5x::onDown5x();
}
void PlayEvents::onUpCosmoMeterMax(void)
{
    CTaskToReachCosmometerMax::complete();
    TESTCHECKPOINT("CosmoMeter MAX POINT");
}

void PlayEvents::onTutorialStarted(void)
{
    
}
void PlayEvents::onTutorialEnded(void)
{
    
}
void PlayEvents::onTaskIsDone(CTask * task)
{
    new FlyTask(task, task->delay);
    UserRating::getInstance()->completeTask(task);

    TESTCHECKPOINT("COMPLETE: " + task->text);
}
void PlayEvents::onTaskIsFailed(CTask * task)
{
    
}
void PlayEvents::onShowMainMenu(void)
{
    
}
void PlayEvents::onShowRatingMenu(void)
{
    
}
void PlayEvents::onShowPauseMenu(void)
{
    
}
void PlayEvents::onShowGameOverMenu(void)
{
    
}
void PlayEvents::onShowTaskMenu(void)
{
    
}
void PlayEvents::onResumePlay(void)
{
    
}
void PlayEvents::onSaveAll(void)
{
    
}
void PlayEvents::onTest(void)
{
    //GameScene::gameScene->ratingMenu->showMenu(1);    //CosmoMeter::getInstance()->flyLabel(0);
}


//-------GAME-EVENTS-----------
PlayEvents * PlayEvents::getInstance()
{
    if (!PlayEvents::mInstance) {
        PlayEvents::mInstance = new PlayEvents();
    }
    return PlayEvents::mInstance;
}

void PlayEvents::destroyInstance()
{
    if (PlayEvents::mInstance) {
        delete PlayEvents::mInstance;
    }
    
}

PlayEvents::PlayEvents()
{
    
}
PlayEvents::~PlayEvents()
{
    
}
