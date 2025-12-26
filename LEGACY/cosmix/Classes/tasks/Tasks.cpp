//
//  Tasks.cpp
//  cosmix
//
//  Created by denver on 09.09.13.
//
//

#include "Tasks.h"
#include "TaskManager.h"

CTask * CTasks::createTask(CTask * taskInfo)
{
    if (taskInfo) {
        switch (taskInfo->type) {
            case TASK_TO_LEARN:                             return new CTaskToLearn();  break;
            case TASK_TO_SCORE_POINTS:                      return new CTaskToScorePoints();    break;
            case TASK_TO_REACH_LEVEL:                       return new CTaskToReachLevel();    break;
            case TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED: return new CTaskToReachLevelNoOneFigureCleared();    break;
            case TASK_TO_CLEAR_FIGURES:                     return new CTaskToClearFigures();    break;
            case TASK_TO_REACH_LEVEL_WITHOUT_GRENADE:       return new CTaskToReachLevelWithoutGrenade();    break;
            case TASK_TO_GET_COINS:                         return new CTaskToGetCoins();    break;
            case TASK_TO_REACH_LEVEL_WITHOUT_COINS:         return new CTaskToReachLevelWithoutCoins();    break;
            case TASK_TO_EXPLODE_FIGURES_WITH_GRENADE:      return new CTaskToExplodeFiguresWithGrenade();    break;
            case TASK_TO_SCORE_POINTS_WITH_BONUS:           return new CTaskToScorePointsWithBonus();    break;
            case TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED:return new CTaskToCompleteLevelOnlyOneColorCleared();    break;
            case TASK_TO_FALL_FIGURES_WITH_FALLEN_BONUS:    return new CTaskToFallFiguresWithFallenBonus();    break;
            case TASK_TO_END_GAME_IN_LEVEL:                 return new CTaskToEndGameInLevel();    break;
            case TASK_TO_MAKE_MEGA_COMBO:                   return new CTaskToMakeMegaCombo();    break;
            case TASK_TO_MAKE_SUPER_COMBO:                  return new CTaskToMakeSuperCombo();    break;
            case TASK_TO_MAKE_COSMO_COMBO:                  return new CTaskToMakeCosmoCombo();    break;
            case TASK_TO_USE_TOUCH_TO_KILL_BONUS:           return new CTaskToUseTouchToKillBonus();    break;
            case TASK_TO_USE_GUN_BONUS:                     return new CTaskToUseGunBonus();    break;
            case TASK_TO_USE_COSMOBOMB_BONUS:               return new CTaskToUseCosmobombBonus();    break;
            case TASK_TO_BURST_BUBBLES:                     return new CTaskToBurstBubbles();    break;
            case TASK_TO_HOLD_COSMOMETER_UP_TO_2X:          return new CTaskToHoldCosmometerUpTo2x();    break;
            case TASK_TO_HOLD_COSMOMETER_UP_TO_3X:          return new CTaskToHoldCosmometerUpTo3x();    break;
            case TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED: return new CTaskToReachLevelNoOneBubbleBursted();    break;
            case TASK_TO_CLEAR_FIGURES_FOR_ONE_TIME:        return new CTaskToClearFiguresForOneTime(); break;
            case TASK_TO_CLEAR_FIGURES_DURING_TIME:         return new CTaskToClearFiguresDuringTime(); break;
                
            case TASK_TO_REACH_COSMOMETER_2X:               return new CTaskToReachCosmometer2X(); break;
            case TASK_TO_REACH_COSMOMETER_3X:               return new CTaskToReachCosmometer3X(); break;
            case TASK_TO_REACH_COSMOMETER_5X:               return new CTaskToReachCosmometer5X(); break;
            case TASK_TO_REACH_COSMOMETER_MAX:              return new CTaskToReachCosmometerMax(); break;
            case TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL:  return new CTaskToReachCosmometer2XWithoutFall(); break;
            case TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL:  return new CTaskToReachCosmometer3XWithoutFall(); break;
            case TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL:  return new CTaskToReachCosmometer5XWithoutFall(); break;
            case TASK_TO_HOLD_COSMOMETER_UP_TO_5X:          return new CTaskToHoldCosmometerUpTo5x(); break;
            case TASK_TO_SCORE_POINTS_NO_REACH_2X:          return new CTaskToScorePointsNoReach2X(); break;
            case TASK_TO_SCORE_POINTS_NO_REACH_3X:          return new CTaskToScorePointsNoReach3X(); break;
            case TASK_TO_CLEAR_FIGURES_OF_COLOR_IN_TIME:    return new CTaskToClearFiguresOfColorInTime(); break;
            case TASK_TO_CLEAR_FIGURES_OF_COLOR:            return new CTaskToClearFiguresOfColor(); break;
            case TASK_TO_REACH_LEVEL_WITHOUT_COMBOS:        return new CTaskToReachLevelWithoutCombos(); break;
            case TASK_TO_SCORE_POINTS_WITHOUT_BONUS:        return new CTaskToScorePointsWithoutBonus(); break;
            case TASK_TO_CLEAR_FIGURES_SAME_COLOR_IN_ROW:   return new CTaskToClearFiguresSameColorInRow(); break;
                
            default:
                break;
        }
    }
    return NULL;
}

int CTasks::taskIdByNameTasks(std::string _taskName)
{
    if (_taskName == "TASK_TO_LEARN")                                   { return TASK_TO_LEARN; };
    if (_taskName == "TASK_TO_SCORE_POINTS")                            { return TASK_TO_SCORE_POINTS; };
    if (_taskName == "TASK_TO_REACH_LEVEL")                             { return TASK_TO_REACH_LEVEL; };
    if (_taskName == "TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED")       { return TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED; };
    if (_taskName == "TASK_TO_CLEAR_FIGURES")                           { return TASK_TO_CLEAR_FIGURES; };
    if (_taskName == "TASK_TO_REACH_LEVEL_WITHOUT_GRENADE")             { return TASK_TO_REACH_LEVEL_WITHOUT_GRENADE; };
    if (_taskName == "TASK_TO_GET_COINS")                               { return TASK_TO_GET_COINS; };
    if (_taskName == "TASK_TO_REACH_LEVEL_WITHOUT_COINS")               { return TASK_TO_REACH_LEVEL_WITHOUT_COINS; };
    if (_taskName == "TASK_TO_EXPLODE_FIGURES_WITH_GRENADE")            { return TASK_TO_EXPLODE_FIGURES_WITH_GRENADE; };
    if (_taskName == "TASK_TO_SCORE_POINTS_WITH_BONUS")                 { return TASK_TO_SCORE_POINTS_WITH_BONUS; };
    if (_taskName == "TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED")   { return TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED; };
    if (_taskName == "TASK_TO_FALL_FIGURES_WITH_FALLEN_BONUS")          { return TASK_TO_FALL_FIGURES_WITH_FALLEN_BONUS; };
    if (_taskName == "TASK_TO_END_GAME_IN_LEVEL")                       { return TASK_TO_END_GAME_IN_LEVEL; };
    if (_taskName == "TASK_TO_MAKE_MEGA_COMBO")                         { return TASK_TO_MAKE_MEGA_COMBO; };
    if (_taskName == "TASK_TO_MAKE_SUPER_COMBO")                        { return TASK_TO_MAKE_SUPER_COMBO; };
    if (_taskName == "TASK_TO_MAKE_COSMO_COMBO")                        { return TASK_TO_MAKE_COSMO_COMBO; };
    if (_taskName == "TASK_TO_USE_TOUCH_TO_KILL_BONUS")                 { return TASK_TO_USE_TOUCH_TO_KILL_BONUS; };
    if (_taskName == "TASK_TO_USE_GUN_BONUS")                           { return TASK_TO_USE_GUN_BONUS; };
    if (_taskName == "TASK_TO_USE_COSMOBOMB_BONUS")                     { return TASK_TO_USE_COSMOBOMB_BONUS; };
    if (_taskName == "TASK_TO_BURST_BUBBLES")                           { return TASK_TO_BURST_BUBBLES; };
    if (_taskName == "TASK_TO_HOLD_COSMOMETER_UP_TO_2X")                { return TASK_TO_HOLD_COSMOMETER_UP_TO_2X; };
    if (_taskName == "TASK_TO_HOLD_COSMOMETER_UP_TO_3X")                { return TASK_TO_HOLD_COSMOMETER_UP_TO_3X; };
    if (_taskName == "TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED")       { return TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED; };
    if (_taskName == "TASK_TO_CLEAR_FIGURES_FOR_ONE_TIME")              { return TASK_TO_CLEAR_FIGURES_FOR_ONE_TIME; };
    if (_taskName == "TASK_TO_CLEAR_FIGURES_DURING_TIME")               { return TASK_TO_CLEAR_FIGURES_DURING_TIME; };
    
    if (_taskName == "TASK_TO_REACH_COSMOMETER_2X")                     { return TASK_TO_REACH_COSMOMETER_2X             ;};
    if (_taskName == "TASK_TO_REACH_COSMOMETER_3X")                     { return TASK_TO_REACH_COSMOMETER_3X             ;};
    if (_taskName == "TASK_TO_REACH_COSMOMETER_5X")                     { return TASK_TO_REACH_COSMOMETER_5X            ;};
    if (_taskName == "TASK_TO_REACH_COSMOMETER_MAX")                    { return TASK_TO_REACH_COSMOMETER_MAX             ;};
    if (_taskName == "TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL")        { return TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL;};
    if (_taskName == "TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL")        { return TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL;};
    if (_taskName == "TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL")        { return TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL;};
    if (_taskName == "TASK_TO_HOLD_COSMOMETER_UP_TO_5X")                { return TASK_TO_HOLD_COSMOMETER_UP_TO_5X;};
    if (_taskName == "TASK_TO_SCORE_POINTS_NO_REACH_2X")                { return TASK_TO_SCORE_POINTS_NO_REACH_2X;};
    if (_taskName == "TASK_TO_SCORE_POINTS_NO_REACH_3X")                { return TASK_TO_SCORE_POINTS_NO_REACH_3X;};
    if (_taskName == "TASK_TO_CLEAR_FIGURES_OF_COLOR_IN_TIME")          { return TASK_TO_CLEAR_FIGURES_OF_COLOR_IN_TIME;};
    if (_taskName == "TASK_TO_CLEAR_FIGURES_OF_COLOR")                  { return TASK_TO_CLEAR_FIGURES_OF_COLOR;};
    if (_taskName == "TASK_TO_REACH_LEVEL_WITHOUT_COMBOS")              { return TASK_TO_REACH_LEVEL_WITHOUT_COMBOS;};
    if (_taskName == "TASK_TO_SCORE_POINTS_WITHOUT_BONUS")              { return TASK_TO_SCORE_POINTS_WITHOUT_BONUS;};
    if (_taskName == "TASK_TO_CLEAR_FIGURES_SAME_COLOR_IN_ROW")         { return TASK_TO_CLEAR_FIGURES_SAME_COLOR_IN_ROW;};

    return -1;
}
// задача пройти обучение
void CTaskToLearn::tutorialComplete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_LEARN);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToLearn * task = dynamic_cast<CTaskToLearn*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
// задача набрать н очков
void CTaskToScorePoints::addPoints(int points)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePoints * task = dynamic_cast<CTaskToScorePoints*>(tasks[i]);
        if (task) {
            task->addValue1(points);
        }
    }
    
}
// задача достигнуть н-го уровня
void CTaskToReachLevel::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevel * task = dynamic_cast<CTaskToReachLevel*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// достич конца игры, не сократив ни одной фигуры
void CTaskToReachLevelNoOneFigureCleared::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelNoOneFigureCleared * task = dynamic_cast<CTaskToReachLevelNoOneFigureCleared*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}
void CTaskToReachLevelNoOneFigureCleared::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_NO_ONE_FIGURE_CLEARED);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelNoOneFigureCleared * task = dynamic_cast<CTaskToReachLevelNoOneFigureCleared*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
// сократить Н фигур
void CTaskToClearFigures::clearFigures(int count)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_CLEAR_FIGURES);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToClearFigures * task = dynamic_cast<CTaskToClearFigures*>(tasks[i]);
        if (task) {
            task->addValue1(count);
        }
    }
}
// дойти до н-го уровня не используя гранаты
void CTaskToReachLevelWithoutGrenade::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_WITHOUT_GRENADE);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelWithoutGrenade * task = dynamic_cast<CTaskToReachLevelWithoutGrenade*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}
void CTaskToReachLevelWithoutGrenade::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_WITHOUT_GRENADE);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelWithoutGrenade * task = dynamic_cast<CTaskToReachLevelWithoutGrenade*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// собрать Н-монет
void CTaskToGetCoins::collectCoins(int coins)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_GET_COINS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToGetCoins * task = dynamic_cast<CTaskToGetCoins*>(tasks[i]);
        if (task) {
            task->addValue1(coins);
        }
    }
}
//дойти до н-го уровня не собрав ни одной монеты
void CTaskToReachLevelWithoutCoins::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_WITHOUT_COINS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelWithoutCoins * task = dynamic_cast<CTaskToReachLevelWithoutCoins*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}
void CTaskToReachLevelWithoutCoins::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_WITHOUT_COINS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelWithoutCoins * task = dynamic_cast<CTaskToReachLevelWithoutCoins*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// взорвать гранатой н-фигур
void CTaskToExplodeFiguresWithGrenade::explode(int figures)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_EXPLODE_FIGURES_WITH_GRENADE);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToExplodeFiguresWithGrenade * task = dynamic_cast<CTaskToExplodeFiguresWithGrenade*>(tasks[i]);
        if (task) {
            task->addValue1(figures);
        }
    }
}
// собрать Н-очков, используя только бонусы
void CTaskToScorePointsWithBonus::addPoints(int points)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_WITH_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsWithBonus * task = dynamic_cast<CTaskToScorePointsWithBonus*>(tasks[i]);
        if (task) {
            task->addValue1(points);
        }
    }
}
//пройти уровень, взрывая фигуры одного цвета
void CTaskToCompleteLevelOnlyOneColorCleared::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToCompleteLevelOnlyOneColorCleared * task = dynamic_cast<CTaskToCompleteLevelOnlyOneColorCleared*>(tasks[i]);
        if (task) {
            if (task->color >= 0) {
                task->setDone();
            }
            task->color = -1;
        }
    }
}

void CTaskToCompleteLevelOnlyOneColorCleared::clearColor(int _color)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_COMPLETE_LEVEL_ONLY_ONE_COLOR_CLEARED);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToCompleteLevelOnlyOneColorCleared * task = dynamic_cast<CTaskToCompleteLevelOnlyOneColorCleared*>(tasks[i]);
        if (task) {
            
            if(task->color == -1){
                task->color = _color;
            }else
            if(task->color != _color){
                task->color = -2;
            }

        }
    }
}
// свалить н-фигур используя бонус падение фигур
void CTaskToFallFiguresWithFallenBonus::fallFigures(int figures)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_FALL_FIGURES_WITH_FALLEN_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToFallFiguresWithFallenBonus * task = dynamic_cast<CTaskToFallFiguresWithFallenBonus*>(tasks[i]);
        if (task) {
            task->addValue1(figures);
        }
    }
}
//- закончить игру на Н-м уровне
void CTaskToEndGameInLevel::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_END_GAME_IN_LEVEL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToEndGameInLevel * task = dynamic_cast<CTaskToEndGameInLevel*>(tasks[i]);
        if (task) {
            task->addValue2(1);
        }
    }
}
void CTaskToEndGameInLevel::gameOver()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_END_GAME_IN_LEVEL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToEndGameInLevel * task = dynamic_cast<CTaskToEndGameInLevel*>(tasks[i]);
        if (task) {
            if (task->currentValue2 == task->reachValue1) {
                task->setDone();
            }
        }
    }
}
// сделать Н мега комбо за игру
void CTaskToMakeMegaCombo::combo()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_MAKE_MEGA_COMBO);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToMakeMegaCombo * task = dynamic_cast<CTaskToMakeMegaCombo*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// - сделать Н супер комбо за игру
void CTaskToMakeSuperCombo::combo()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_MAKE_SUPER_COMBO);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToMakeSuperCombo * task = dynamic_cast<CTaskToMakeSuperCombo*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// - сделать Н космо комбо за игру
void CTaskToMakeCosmoCombo::combo()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_MAKE_COSMO_COMBO);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToMakeCosmoCombo * task = dynamic_cast<CTaskToMakeCosmoCombo*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
//лопнуть за игру Н пузырей
void CTaskToBurstBubbles::burstBubble()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_BURST_BUBBLES);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToBurstBubbles * task = dynamic_cast<CTaskToBurstBubbles*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
    
}
//достич Н-го уровня не собрав ни одного пузыря
void CTaskToReachLevelNoOneBubbleBursted::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelNoOneBubbleBursted * task = dynamic_cast<CTaskToReachLevelNoOneBubbleBursted*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
void CTaskToReachLevelNoOneBubbleBursted::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_NO_ONE_BUBBLE_BURSTED);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelNoOneBubbleBursted * task = dynamic_cast<CTaskToReachLevelNoOneBubbleBursted*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}
//сократить за один раз Н фигур
void CTaskToClearFiguresForOneTime::clearFigures(int count)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_CLEAR_FIGURES_FOR_ONE_TIME);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToClearFiguresForOneTime * task = dynamic_cast<CTaskToClearFiguresForOneTime*>(tasks[i]);
        if (task) {
            if (task->reachValue1 <= count) {
                task->setDone();
            };
        }
    }
}
///сократить Н фигур за определенное время
void CTaskToClearFiguresDuringTime::clearFigure()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_CLEAR_FIGURES_DURING_TIME);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToClearFiguresDuringTime * task = dynamic_cast<CTaskToClearFiguresDuringTime*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->add();
                /*if (task->during->isReached) {
                    task->setDone();
                }*/
            }
        }
    }
}
void CTaskToClearFiguresDuringTime::onReached(CCObject * object)
{
    setDone();
}
///не опускать шкалу ниже 2х более н секунд
void CTaskToHoldCosmometerUpTo2x::onUp2x()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_HOLD_COSMOMETER_UP_TO_2X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToHoldCosmometerUpTo2x * task = dynamic_cast<CTaskToHoldCosmometerUpTo2x*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->add();
            }
        }
    }
}
void CTaskToHoldCosmometerUpTo2x::onDown2x()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_HOLD_COSMOMETER_UP_TO_2X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToHoldCosmometerUpTo2x * task = dynamic_cast<CTaskToHoldCosmometerUpTo2x*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->removeAll();
            }
        }
    }
}
void CTaskToHoldCosmometerUpTo2x::onReached(CCObject * object)
{
    setDone();
}
///не опускать шкалу ниже 3х более н секунд
void CTaskToHoldCosmometerUpTo3x::onUp3x()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_HOLD_COSMOMETER_UP_TO_3X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToHoldCosmometerUpTo3x * task = dynamic_cast<CTaskToHoldCosmometerUpTo3x*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->add();
            }
        }
    }
}
void CTaskToHoldCosmometerUpTo3x::onDown3x()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_HOLD_COSMOMETER_UP_TO_3X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToHoldCosmometerUpTo3x * task = dynamic_cast<CTaskToHoldCosmometerUpTo3x*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->removeAll();
            }
        }
    }
}
void CTaskToHoldCosmometerUpTo3x::onReached(CCObject * object)
{
    setDone();
}
///не опускать шкалу ниже 5х более н секунд
void CTaskToHoldCosmometerUpTo5x::onUp5x()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_HOLD_COSMOMETER_UP_TO_5X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToHoldCosmometerUpTo5x * task = dynamic_cast<CTaskToHoldCosmometerUpTo5x*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->add();
            }
        }
    }
}
void CTaskToHoldCosmometerUpTo5x::onDown5x()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_HOLD_COSMOMETER_UP_TO_5X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToHoldCosmometerUpTo5x * task = dynamic_cast<CTaskToHoldCosmometerUpTo5x*>(tasks[i]);
        if (task) {
            if (task->during) {
                task->during->removeAll();
            }
        }
    }
}
void CTaskToHoldCosmometerUpTo5x::onReached(CCObject * object)
{
    setDone();
}

// использовать бонус пальцекилл ПРОВЕРИТЬ
void CTaskToUseTouchToKillBonus::useBonus()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_USE_TOUCH_TO_KILL_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToUseTouchToKillBonus * task = dynamic_cast<CTaskToUseTouchToKillBonus*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// использовать бонус пулемет
void CTaskToUseGunBonus::useBonus()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_USE_GUN_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToUseGunBonus * task = dynamic_cast<CTaskToUseGunBonus*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}
// использовать бонус космобомбу
void CTaskToUseCosmobombBonus::useBonus()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_USE_COSMOBOMB_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToUseCosmobombBonus * task = dynamic_cast<CTaskToUseCosmobombBonus*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}

///достигнуть точку шкалы космометра 2Х
void CTaskToReachCosmometer2X::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_2X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer2X * task = dynamic_cast<CTaskToReachCosmometer2X*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
///достигнуть точку шкалы космометра 3Х
void CTaskToReachCosmometer3X::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_3X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer3X * task = dynamic_cast<CTaskToReachCosmometer3X*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
///достигнуть точку шкалы космометра 5Х
void CTaskToReachCosmometer5X::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_5X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer5X * task = dynamic_cast<CTaskToReachCosmometer5X*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
///достигнуть максимальную точку шкалы космометра
void CTaskToReachCosmometerMax::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_MAX);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometerMax * task = dynamic_cast<CTaskToReachCosmometerMax*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
///достигнуть точку шкалы космометра 2Х не используя бонус падения фигур
void CTaskToReachCosmometer2XWithoutFall::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer2XWithoutFall * task = dynamic_cast<CTaskToReachCosmometer2XWithoutFall*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
void CTaskToReachCosmometer2XWithoutFall::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_2X_WITHOUT_FALL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer2XWithoutFall * task = dynamic_cast<CTaskToReachCosmometer2XWithoutFall*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}

///достигнуть точку шкалы космометра 3Х не используя бонус падения фигур
void CTaskToReachCosmometer3XWithoutFall::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer3XWithoutFall * task = dynamic_cast<CTaskToReachCosmometer3XWithoutFall*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
void CTaskToReachCosmometer3XWithoutFall::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_3X_WITHOUT_FALL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer3XWithoutFall * task = dynamic_cast<CTaskToReachCosmometer3XWithoutFall*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}

///достигнуть точку шкалы космометра 5Х не используя бонус падения фигур
void CTaskToReachCosmometer5XWithoutFall::complete()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer5XWithoutFall * task = dynamic_cast<CTaskToReachCosmometer5XWithoutFall*>(tasks[i]);
        if (task) {
            task->setDone();
        }
    }
}
void CTaskToReachCosmometer5XWithoutFall::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_COSMOMETER_5X_WITHOUT_FALL);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachCosmometer5XWithoutFall * task = dynamic_cast<CTaskToReachCosmometer5XWithoutFall*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}

///набрать Н очков не превысив шкалу 2Х
void CTaskToScorePointsNoReach2X::addPoints(int points)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_NO_REACH_2X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsNoReach2X * task = dynamic_cast<CTaskToScorePointsNoReach2X*>(tasks[i]);
        if (task) {
            task->addValue1(points);
        }
    }
}
void CTaskToScorePointsNoReach2X::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_NO_REACH_2X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsNoReach2X * task = dynamic_cast<CTaskToScorePointsNoReach2X*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}
///набрать Н очков не превысив шкалу 3Х
void CTaskToScorePointsNoReach3X::addPoints(int points)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_NO_REACH_3X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsNoReach3X * task = dynamic_cast<CTaskToScorePointsNoReach3X*>(tasks[i]);
        if (task) {
            task->addValue1(points);
        }
    }
}
void CTaskToScorePointsNoReach3X::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_NO_REACH_3X);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsNoReach3X * task = dynamic_cast<CTaskToScorePointsNoReach3X*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}



///сократить Н фигур одного и того же цвета подряд
void CTaskToClearFiguresSameColorInRow::clearFigure(int color)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_CLEAR_FIGURES_SAME_COLOR_IN_ROW);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToClearFiguresSameColorInRow * task = dynamic_cast<CTaskToClearFiguresSameColorInRow*>(tasks[i]);
        if (task) {
            if (task->during) {
                if (task->lastColor > 0) {
                    if (task->lastColor != color) {
                        task->during->removeAll();
                    }
                }
                task->lastColor = color;
                task->during->add();
                
                //task->during->add();
                /*if (task->during->isReached) {
                 task->setDone();
                 }*/
            }
        }
    }
}


///сократить Н фигур одного цвета за М секунд
void CTaskToClearFiguresOfColorInTime::clearFigure(int color)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_CLEAR_FIGURES_OF_COLOR_IN_TIME);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToClearFiguresOfColorInTime * task = dynamic_cast<CTaskToClearFiguresOfColorInTime*>(tasks[i]);
        if (task) {
                DuringTime * during = NULL;
                if( task->durings.find(color) != task->durings.end())
                {
                    during = task->durings.find(color)->second;
                    if(during){
                        during->add();
                    }
                }
        }
    }
}


///сократить Н фигур определенного цвета цвета за игру
void CTaskToClearFiguresOfColor::clearFigure(int color)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_CLEAR_FIGURES_OF_COLOR);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToClearFiguresOfColor * task = dynamic_cast<CTaskToClearFiguresOfColor*>(tasks[i]);
        if (task) {
            if (color == task->reachValue2) {
                task->addValue1(1);
            }
        }
    }
}
///дойти до Н уровня не сделав ни одного комбо
void CTaskToReachLevelWithoutCombos::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_WITHOUT_COMBOS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelWithoutCombos * task = dynamic_cast<CTaskToReachLevelWithoutCombos*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}
void CTaskToReachLevelWithoutCombos::completeLevel()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_REACH_LEVEL_WITHOUT_COMBOS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToReachLevelWithoutCombos * task = dynamic_cast<CTaskToReachLevelWithoutCombos*>(tasks[i]);
        if (task) {
            task->addValue1(1);
        }
    }
}


///набрать Н очков не превысив шкалу 3Х
void CTaskToScorePointsWithoutBonus::addPoints(int points)
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_WITHOUT_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsWithoutBonus * task = dynamic_cast<CTaskToScorePointsWithoutBonus*>(tasks[i]);
        if (task) {
            task->addValue1(points);
        }
    }
}
void CTaskToScorePointsWithoutBonus::failed()
{
    std::vector<CTask*> tasks = CTaskManager::getInstance()->getTasksByType(TASK_TO_SCORE_POINTS_WITHOUT_BONUS);
    for (int i=0; i < tasks.size(); i++) {
        CTaskToScorePointsWithoutBonus * task = dynamic_cast<CTaskToScorePointsWithoutBonus*>(tasks[i]);
        if (task) {
            task->setFailed();
        }
    }
}