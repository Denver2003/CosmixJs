//
//  Tasks.h
//  cosmix
//
//  Created by denver on 09.09.13.
//
//

#ifndef __cosmix__Tasks__
#define __cosmix__Tasks__

// enum tasks
#define TASK_TO_LEARN                                   0/*one*/
#define TASK_TO_SCORE_POINTS                            1
#define TASK_TO_REACH_LEVEL                             2
#define TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED       3/*one*/
#define TASK_TO_CLEAR_FIGURES                           4
#define TASK_TO_REACH_LEVEL_WITHOUT_GRENADE             5
#define TASK_TO_GET_COINS                               6
#define TASK_TO_REACH_LEVEL_WITHOUT_COINS               7
#define TASK_TO_EXPLODE_FIGURES_WITH_GRENADE            8
#define TASK_TO_SCORE_POINTS_WITH_BONUS                 9
#define TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED   10/*one*/
#define TASK_TO_FALL_FIGURES_WITH_FALLEN_BONUS          11
#define TASK_TO_END_GAME_IN_LEVEL                       12
#define TASK_TO_MAKE_MEGA_COMBO                         13
#define TASK_TO_MAKE_SUPER_COMBO                        14
#define TASK_TO_MAKE_COSMO_COMBO                        15
#define TASK_TO_USE_TOUCH_TO_KILL_BONUS                 16
#define TASK_TO_USE_GUN_BONUS                           17
#define TASK_TO_USE_COSMOBOMB_BONUS                     18
#define TASK_TO_BURST_BUBBLES                           19
#define TASK_TO_HOLD_COSMOMETER_UP_TO_2X                20
#define TASK_TO_HOLD_COSMOMETER_UP_TO_3X                21/*hard*/
#define TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED       22
#define TASK_TO_CLEAR_FIGURES_FOR_ONE_TIME              23
#define TASK_TO_CLEAR_FIGURES_DURING_TIME               24

//новые задачи

#define TASK_TO_REACH_COSMOMETER_2X                    25
#define TASK_TO_REACH_COSMOMETER_3X                    26
#define TASK_TO_REACH_COSMOMETER_5X                    27
#define TASK_TO_REACH_COSMOMETER_MAX                   28/*hard*/
#define TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL       29
#define TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL       30/*hard*/
#define TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL       31/*very very hard*/
#define TASK_TO_HOLD_COSMOMETER_UP_TO_5X               32/*very hard*/

#define TASK_TO_SCORE_POINTS_NO_REACH_2X               33
#define TASK_TO_SCORE_POINTS_NO_REACH_3X               34
#define TASK_TO_CLEAR_FIGURES_OF_COLOR_IN_TIME         35
#define TASK_TO_CLEAR_FIGURES_OF_COLOR                 36
#define TASK_TO_REACH_LEVEL_WITHOUT_COMBOS             37
#define TASK_TO_SCORE_POINTS_WITHOUT_BONUS             38
#define TASK_TO_CLEAR_FIGURES_SAME_COLOR_IN_ROW        39

#include "Task.h"
#include "DuringTime.h"
//#include "TaskManager.h"

class CTasks{
public:
    CTasks(){};
    static CTask * createTask(CTask * taskInfo);
    static int taskIdByNameTasks(std::string _taskName);
};


// задача пройти обучение *
class CTaskToLearn : public CTask{
public:
    CTaskToLearn():CTask(TASK_TO_LEARN){};
    static void tutorialComplete();
};
// задача набрать н очков *
class CTaskToScorePoints : public CTask{
public:
    CTaskToScorePoints():CTask(TASK_TO_SCORE_POINTS){};
    static void addPoints(int points);
};
// задача достигнуть н-го уровня *
class CTaskToReachLevel : public CTask{
public:
    CTaskToReachLevel():CTask(TASK_TO_REACH_LEVEL){};
    void init(void){setInitValue1(-1);};
    static void completeLevel();
};
// достич конца игры, не сократив ни одной фигуры *
class CTaskToReachLevelNoOneFigureCleared : public CTask{
public:
    CTaskToReachLevelNoOneFigureCleared():CTask(TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED){};
    void init(void){delay = 0;};
    static void failed();
    static void complete();
};
// сократить Н фигур *
class CTaskToClearFigures : public CTask{
public:
    CTaskToClearFigures():CTask(TASK_TO_CLEAR_FIGURES){};
    static void clearFigures(int count);
};
// дойти до н-го уровня не используя гранаты *
class CTaskToReachLevelWithoutGrenade : public CTask{
public:
    CTaskToReachLevelWithoutGrenade():CTask(TASK_TO_REACH_LEVEL_WITHOUT_GRENADE){};
    void init(void){setInitValue1(-1);};
    static void failed();
    static void completeLevel();
};
// собрать Н-монет *
class CTaskToGetCoins : public CTask{
public:
    CTaskToGetCoins():CTask(TASK_TO_GET_COINS){};
    static void collectCoins(int coins);
};
//дойти до н-го уровня не собрав ни одной монеты *
class CTaskToReachLevelWithoutCoins : public CTask{
public:
    CTaskToReachLevelWithoutCoins():CTask(TASK_TO_REACH_LEVEL_WITHOUT_COINS){};
    void init(void){setInitValue1(-1);};
    static void failed();
    static void completeLevel();
};
// взорвать гранатой н-фигур *
class CTaskToExplodeFiguresWithGrenade : public CTask{
public:
    CTaskToExplodeFiguresWithGrenade():CTask(TASK_TO_EXPLODE_FIGURES_WITH_GRENADE){};
    static void explode(int figures);
};
// собрать Н-очков, используя только бонусы *
class CTaskToScorePointsWithBonus : public CTask{
public:
    CTaskToScorePointsWithBonus():CTask(TASK_TO_SCORE_POINTS_WITH_BONUS){};
    static void addPoints(int points);
};
//пройти уровень, взрывая фигуры одного цвета *
class CTaskToCompleteLevelOnlyOneColorCleared : public CTask{
public:
    int color;
    CTaskToCompleteLevelOnlyOneColorCleared():CTask(TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED){color = -1;};
    void init(void){color = -1;};
    static void completeLevel();
    static void clearColor(int _color);
    
};
// свалить н-фигур используя бонус падение фигур *
class CTaskToFallFiguresWithFallenBonus : public CTask{
public:
    CTaskToFallFiguresWithFallenBonus():CTask(TASK_TO_FALL_FIGURES_WITH_FALLEN_BONUS){};
    static void fallFigures(int figures);
};
//- закончить игру на Н-м уровне *
class CTaskToEndGameInLevel : public CTask{
public:
    CTaskToEndGameInLevel():CTask(TASK_TO_END_GAME_IN_LEVEL){};
    static void completeLevel();
    static void gameOver();
};
// сделать Н мега комбо за игру *
class CTaskToMakeMegaCombo : public CTask{
public:
    CTaskToMakeMegaCombo():CTask(TASK_TO_MAKE_MEGA_COMBO){};
    static void combo();
};
// - сделать Н супер комбо за игру *
class CTaskToMakeSuperCombo : public CTask{
public:
    CTaskToMakeSuperCombo():CTask(TASK_TO_MAKE_SUPER_COMBO){};
    static void combo();
};
// - сделать Н космо комбо за игру *
class CTaskToMakeCosmoCombo : public CTask{
public:
    CTaskToMakeCosmoCombo():CTask(TASK_TO_MAKE_COSMO_COMBO){};
    static void combo();
};
//лопнуть за игру Н пузырей *
class CTaskToBurstBubbles : public CTask{
public:
    CTaskToBurstBubbles():CTask(TASK_TO_BURST_BUBBLES){};
    static void burstBubble();
};
//достич Н-го уровня не собрав ни одного пузыря *
class CTaskToReachLevelNoOneBubbleBursted : public CTask{
public:
    CTaskToReachLevelNoOneBubbleBursted():CTask(TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED){};
    void init(void){setInitValue1(-1);};
    static void completeLevel();
    static void failed();
};
//сократить за один раз Н фигур
class CTaskToClearFiguresForOneTime : public CTask{
public:
    CTaskToClearFiguresForOneTime():CTask(TASK_TO_CLEAR_FIGURES_FOR_ONE_TIME){};
    static void clearFigures(int count);
};
//сократить Н фигур за определенное время
class CTaskToClearFiguresDuringTime : public CTask{
public:
    DuringTime * during;
    CTaskToClearFiguresDuringTime():CTask(TASK_TO_CLEAR_FIGURES_DURING_TIME){during = NULL;};
    void initOnce(){
        during = DuringTime::createDuringTime((float)reachValue2,reachValue1);
    };
    void init(void){
        if(during){
            during->clear();
            during->start();
            during->setDoneFunction(this,
                    callfuncO_selector(CTaskToClearFiguresDuringTime::onReached));
        }
    };
    void onReached(CCObject * object);
    static void clearFigure();
    void onEndGame(void){
        if(during){
            during->stop();
        }
    };
};

//------

//не опускать шкалу ниже 2х более н секунд
class CTaskToHoldCosmometerUpTo2x : public CTask{
public:
    DuringTime * during;
    CTaskToHoldCosmometerUpTo2x():CTask(TASK_TO_HOLD_COSMOMETER_UP_TO_2X)
    {during = NULL;};
    void initOnce(){
        during = DuringTime::createDuringTime((float)reachValue2,1,DURINGTYPE_WAITING);
    };
    void init(void){
        if(during){
            during->clear();
            during->start();
            during->setDoneFunction(this,
                                    callfuncO_selector(CTaskToHoldCosmometerUpTo2x::onReached));
        }
    };
    void onReached(CCObject * object);
    static void onUp2x();
    static void onDown2x();
    void onEndGame(void){
        if(during){
            during->stop();
        }
    };
    
};


//не опускать шкалу ниже 3х более н секунд
class CTaskToHoldCosmometerUpTo3x : public CTask{
public:
    DuringTime * during;
    CTaskToHoldCosmometerUpTo3x():CTask(TASK_TO_HOLD_COSMOMETER_UP_TO_3X)
    {during = NULL;};
    void initOnce(){
        during = DuringTime::createDuringTime((float)reachValue2,1,DURINGTYPE_WAITING);
    };
    void init(void){
        if(during){
            during->clear();
            during->start();
            during->setDoneFunction(this,
                                    callfuncO_selector(CTaskToHoldCosmometerUpTo2x::onReached));
        }
    };
    void onReached(CCObject * object);
    static void onUp3x();
    static void onDown3x();
    void onEndGame(void){
        if(during){
            during->stop();
        }
    };
    
    
};
//не опускать шкалу ниже 5х более н секунд
class CTaskToHoldCosmometerUpTo5x : public CTask{
public:
    DuringTime * during;
    CTaskToHoldCosmometerUpTo5x():CTask(TASK_TO_HOLD_COSMOMETER_UP_TO_5X)
    {during = NULL;};
    void initOnce(){
        during = DuringTime::createDuringTime((float)reachValue2,1,DURINGTYPE_WAITING);
    };
    void init(void){
        if(during){
            during->clear();
            during->start();
            during->setDoneFunction(this,
                                    callfuncO_selector(CTaskToHoldCosmometerUpTo2x::onReached));
        }
    };
    void onReached(CCObject * object);
    static void onUp5x();
    static void onDown5x();
    void onEndGame(void){
        if(during){
            during->stop();
        }
    };

    
};
// использовать бонус пальцекилл
class CTaskToUseTouchToKillBonus : public CTask{
public:
    CTaskToUseTouchToKillBonus():CTask(TASK_TO_USE_TOUCH_TO_KILL_BONUS){};
    static void useBonus();
};
// использовать бонус пулемет
class CTaskToUseGunBonus : public CTask{
public:
    CTaskToUseGunBonus():CTask(TASK_TO_USE_GUN_BONUS){};
    static void useBonus();
};
// использовать бонус космобомбу
class CTaskToUseCosmobombBonus : public CTask{
public:
    CTaskToUseCosmobombBonus():CTask(TASK_TO_USE_COSMOBOMB_BONUS){};
    static void useBonus();
};

///достигнуть точку шкалы космометра 2Х
class CTaskToReachCosmometer2X : public CTask{
public:
    CTaskToReachCosmometer2X():CTask(TASK_TO_REACH_COSMOMETER_2X){};
    static void complete();
};
///достигнуть точку шкалы космометра 3Х
class CTaskToReachCosmometer3X : public CTask{
public:
    CTaskToReachCosmometer3X():CTask(TASK_TO_REACH_COSMOMETER_3X){};
    static void complete();
};
///достигнуть точку шкалы космометра 5Х
class CTaskToReachCosmometer5X : public CTask{
public:
    CTaskToReachCosmometer5X():CTask(TASK_TO_REACH_COSMOMETER_5X){};
    static void complete();
};
///достигнуть максимальную точку шкалы космометра
class CTaskToReachCosmometerMax : public CTask{
public:
    CTaskToReachCosmometerMax():CTask(TASK_TO_REACH_COSMOMETER_MAX){};
    static void complete();
};
///достигнуть точку шкалы космометра 2Х не используя бонус падения фигур
class CTaskToReachCosmometer2XWithoutFall : public CTask{
public:
    CTaskToReachCosmometer2XWithoutFall():CTask(TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL){};
    static void complete();
    static void failed();
};
///достигнуть точку шкалы космометра 3Х не используя бонус падения фигур
class CTaskToReachCosmometer3XWithoutFall : public CTask{
public:
    CTaskToReachCosmometer3XWithoutFall():CTask(TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL){};
    static void complete();
    static void failed();
};
///достигнуть точку шкалы космометра 5Х не используя бонус падения фигур
class CTaskToReachCosmometer5XWithoutFall : public CTask{
public:
    CTaskToReachCosmometer5XWithoutFall():CTask(TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL){};
    static void complete();
    static void failed();
};
///набрать Н очков не превысив шкалу 2Х
class CTaskToScorePointsNoReach2X : public CTask{
public:
    CTaskToScorePointsNoReach2X():CTask(TASK_TO_SCORE_POINTS_NO_REACH_2X){};
    static void addPoints(int points);
    static void failed();
};
///набрать Н очков не превысив шкалу 3Х
class CTaskToScorePointsNoReach3X : public CTask{
public:
    CTaskToScorePointsNoReach3X():CTask(TASK_TO_SCORE_POINTS_NO_REACH_3X){};
    static void addPoints(int points);
    static void failed();
};
///сократить Н фигур одного и того же цвета подряд за Х секунд
class CTaskToClearFiguresSameColorInRow : public CTask{
public:
    CTaskToClearFiguresSameColorInRow():CTask(TASK_TO_CLEAR_FIGURES_SAME_COLOR_IN_ROW)
    {during = NULL;};
    
    DuringTime * during;
    int lastColor;
    void initOnce(){
        during = DuringTime::createDuringTime((float)9999,reachValue1);
    };
    void init(void){
        lastColor = -1;
        if(during){
            during->clear();
            during->start();
            during->setDoneFunction(this,
                                    callfuncO_selector(CTaskToClearFiguresSameColorInRow::onReached));
        }
    };
    void onReached(CCObject * object){setDone();}
    static void clearFigure(int color);
    void onEndGame(void){
        if(during){
            during->stop();
        }
    };
};
///сократить Н фигур одного цвета за М секунд
class CTaskToClearFiguresOfColorInTime : public CTask{
public:
    
    CTaskToClearFiguresOfColorInTime():CTask(TASK_TO_CLEAR_FIGURES_OF_COLOR_IN_TIME)
    {};

    map<int,DuringTime*> durings;
//    DuringTime * during;
    int lastColor;
    void initOnce(){
        for (int i = 1; i < 9; i++) {
            DuringTime * during = DuringTime::createDuringTime((float)reachValue2,reachValue1);
            durings.insert(make_pair(i, during));
        }
        
    };
    void init(void){
        lastColor = -1;
        for (int i = 1; i < 9; i++) {
            DuringTime * during = NULL;
            if( durings.find(i) != durings.end())
            {
                during = durings.find(i)->second;
                if(during){
                    during->clear();
                    during->start();
                    during->setDoneFunction(this,
                                        callfuncO_selector(CTaskToClearFiguresOfColorInTime::onReached));
                }
            }
        }
    };
    void onEndGame(void){
        for (int i = 1; i < 9; i++) {
            DuringTime * during = NULL;
            if( durings.find(i) != durings.end())
            {
                during = durings.find(i)->second;
                if(during){
                    during->stop();
                }
            }
        }
    }
    
    void onReached(CCObject * object){setDone();}
    static void clearFigure(int color);
};
///сократить Н фигур определенного цвета цвета за игру
class CTaskToClearFiguresOfColor : public CTask{
public:
    CTaskToClearFiguresOfColor():CTask(TASK_TO_CLEAR_FIGURES_OF_COLOR){};
    static void clearFigure(int color);
};


///дойти до Н уровня не сделав ни одного комбо
class CTaskToReachLevelWithoutCombos : public CTask{
public:
    CTaskToReachLevelWithoutCombos():CTask(TASK_TO_REACH_LEVEL_WITHOUT_COMBOS){};
    void init(void){setInitValue1(-1);};
    static void failed();
    static void completeLevel();
};
///набрать Н очков не используя бонусов
class CTaskToScorePointsWithoutBonus : public CTask{
public:
    CTaskToScorePointsWithoutBonus():CTask(TASK_TO_SCORE_POINTS_WITHOUT_BONUS){};
    static void addPoints(int points);
    static void failed();
};

#endif /* defined(__cosmix__Tasks__) */
