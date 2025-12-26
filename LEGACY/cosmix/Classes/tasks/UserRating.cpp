//
//  UserRating.cpp
//  cosmix
//
//  Created by denver on 05.09.13.
//
//

#include "UserRating.h"
#include "LevelLoader.h"
#include "GameScene.h"
#include "TaskManager.h"


UserRating * UserRating::mInstance = NULL;

UserRating::UserRating()
{
    stars       = 0;
    level       = 0;
    rating      = 0;
    prevStars   = 0;
    prevLevel   = 0;
    prevRating  = 0;
    localStars  = 0;
    prevLocalStars= 0;
    isNewStar   = false;
    isNewLevel  = false;
    isNewRating = false;
    init        = false;
    currentTask = NULL;
    nextStarSprite = NULL;
}

UserRating::~UserRating()
{
    
}

UserRating * UserRating::getInstance()
{
    if (!UserRating::mInstance) {
        UserRating::mInstance = new UserRating();
        UserRating::mInstance->load();
    }
    return UserRating::mInstance;
}

void UserRating::destroyInstance()
{
    if (UserRating::mInstance) {
        delete UserRating::mInstance;
        UserRating::mInstance = NULL;
    }
}

// загрузка данных о рейтинге
void UserRating::load(void)
{
    calculate();

    prevStars   = stars;
    prevLevel   = level;
    prevRating  = rating;
    
    
}

// сохранение данных о рейтинге
void UserRating::save(void)
{
}
void UserRating::calculate(void)
{
    
    //TEMP
    stars       = 0;
    level       = 0;
    rating      = 0;
    localStars  = 0;
    
    for (int i = 0; i < CTaskManager::getInstance()->sortedTasksList.size(); i++) {
        CTask * task = CTaskManager::getInstance()->sortedTasksList[i];
        if (task) {
            if (task->isCleared) {
                stars++;
            }
        }
    }
    
    if (stars > 0) {
        level       = stars / 5 ;
        localStars  = stars % 5 ;
        
        rating = ratingByLevel(level);

    }
}
int UserRating::ratingByStars(int _starCount){
    if (_starCount > 0) {
        int _level       = _starCount / 5 ;
        int _rating = ratingByLevel(_level);
        return _rating;
    }
    return 0;
}

int UserRating::ratingByLevel(int _level)
{
    int _rating = 0; //nobody
    if (_level >= RATING_LORD) {
        _rating = 7;
    }else if(_level >= RATING_COSMONAUT) {
        _rating = 6;
    }else if(_level >= RATING_EXPERT) {
        _rating = 5;
    }else if(_level >= RATING_ADVANCED) {
        _rating = 4;
    }else if(_level >= RATING_INTERMEDIATE) {
        _rating = 3;
    }else if(_level >= RATING_BEGINNER) {
        _rating = 2;
    }else if(_level >= RATING_NEWBY) {
        _rating = 1;
    }
    return _rating;
}
// увеличение очков опыта
void UserRating::completeTask(CTask * task)
{
    completedTasks.push_back(task);
    //task->save();
//    save();
}


void UserRating::onBeginGame()
{
    //очищаем флаги
    calculate();
    
    prevStars       = stars;
    prevLevel       = level;
    prevRating      = rating;
    showRatingFrom  = 0;
    prevLocalStars  = localStars;
    
    //чистим предыдущие задачи
    completedTasks.clear();

    
    if (!init) {
        /// единоразовая инициализация позиций звезд и т.п.
        starCenters.clear();
        movingSprites.clear();
        for (int i=1; i <= 5; i++) {
            char starName[10];
            sprintf(starName, "star%i",i);
            menuElement * starElement = GameScene::gameScene->ratingMenu->getElementByName(starName);
            if (starElement) {
                LHSprite * starSprite = dynamic_cast<LHSprite*>(starElement->sprite);
                if (starSprite) {
                    starSprite->prepareAnimationNamed("star", "rating.pshs");
                    starCenters.push_back(starSprite);
                    movingSprites.push_back(starSprite);//добавляем спрайты звезд
                }
            }
        }
        
        menuElement * tmpElement = GameScene::gameScene->ratingMenu->getElementByName("end_task");

        if (tmpElement) {
            endTaskLabelPoint = tmpElement->endPoint;
        }
        
        /// заполняем спрайты для движения вверх после всех анимаций
        CCLabelBMFont * tmpLabel = GameScene::gameScene->ratingMenu->getLabelByName("level");
        if (tmpLabel) {
            movingSprites.push_back(tmpLabel);
        }
        tmpElement = GameScene::gameScene->ratingMenu->getElementByName("pedestal");
        if (tmpElement) {
            movingSprites.push_back(tmpElement->sprite);
        }
        /*tmpElement = GameScene::gameScene->ratingMenu->getElementByName("pruzhina");
        if (tmpElement) {
            movingSprites.push_back(tmpElement->sprite);
        }*/
        tmpElement = GameScene::gameScene->ratingMenu->getElementByName("icon");
        if (tmpElement) {
            movingSprites.push_back(tmpElement->sprite);
        }
        tmpElement = GameScene::gameScene->ratingMenu->getElementByName("label");
        if (tmpElement) {
            movingSprites.push_back(tmpElement->sprite);
        }
        
        init = true;
    }
    
    
}

void UserRating::onEndGame(LevelHelperLoader * loader)
{
    ///получаем новы данные
    calculate();
    
    
    if (GameScene::gameScene->ratingMenu) {
        GameScene::gameScene->ratingMenu->showMenu(0.8);
    }
    // тут мы делаем анимацию выполненных задач, увеличение уровня и повышение рейтинга
}


void UserRating::onPreShowRatingMenu(CCObject * object)
{
    /// инициализация окна отображения рейтинга
    ///звезды
    for (int i=1; i <= 5; i++) {
        char starName[10];
        sprintf(starName, "star%i",i);
        menuElement * starElement = GameScene::gameScene->ratingMenu->getElementByName(starName);
        if (starElement) {
            starElement->isVisible = false;
            if ( i <= prevLocalStars ) {
                starElement->isVisible = true;
                LHSprite * starSprite = dynamic_cast<LHSprite*>(starElement->sprite);
                if (starSprite) {
                    starSprite->prepareAnimationNamed("star", "rating.pshs");
                    starSprite->setFrame(0);
                }
            }
        }
    }
    menuElement * element = GameScene::gameScene->ratingMenu->getElementByName("star");
    LHSprite * tmpSprite = NULL;
    ///задача
    if (element) {
        element->isVisible = false;
    }
    element = GameScene::gameScene->ratingMenu->getElementByName("task");
    if (element ){
        element->isVisible = false;
    }
    
    element = GameScene::gameScene->ratingMenu->getElementByName("icon");
    if (element) {
        if (prevRating < 1) {
            element->isVisible = false;
        }else{
            tmpSprite = dynamic_cast<LHSprite*>(element->sprite);
            if (tmpSprite) {
                tmpSprite->prepareAnimationNamed("icon", "rating.pshs");
                tmpSprite->setFrame(prevRating-1);
            }
        }
    }
    
    element = GameScene::gameScene->ratingMenu->getElementByName("label");
    if (element) {
        if (prevRating < 1) {
            element->isVisible = false;
        }else{
            tmpSprite = dynamic_cast<LHSprite*>(element->sprite);
            if (tmpSprite) {
                tmpSprite->prepareAnimationNamed("label", "rating.pshs");
                tmpSprite->setFrame(prevRating-1);
            }
        }
    }
    
    CCLabelBMFont * labelLevel  = GameScene::gameScene->ratingMenu->getLabelByName("level");
    if (labelLevel) {
        char levelStr[10];
        sprintf(levelStr, "%d", prevLevel);
        labelLevel->setCString(levelStr);
    }
    
    
    for (int i=0; i < starCenters.size(); i++) {
        char strCount[10];
        sprintf(strCount, "star%i",i+1 );
        element = GameScene::gameScene->ratingMenu->getElementByName(strCount);
        if (element) {
            starCenters[i]->setPosition(element->endPoint);
        }
    }
    
    menuElement * tmpElement = GameScene::gameScene->ratingMenu->getElementByName("resume");
    if (tmpElement) {
        tmpElement->isVisible = false;
    }
    
}

void UserRating::addingTaskStar(CCObject * object)
{
    isNewLevel = false;
    isNewRating = false;
    
    currentTask = NULL;
    if (completedTasks.size() > 0) {
        currentTask = completedTasks[0];
        completedTasks.erase(completedTasks.begin());
        
        //1. выводим задание на экран
        
        //1.1 ищем координаты следующей звезды
        nextStarSprite = NULL;
        //prevLocalStars starCenters
        
        
        if (prevLocalStars < starCenters.size()) {
            nextStarSprite = starCenters[prevLocalStars];
        }
        
        if (prevLocalStars == 4) {
            isNewLevel = true;
            prevLocalStars = 0;
            prevStars++;
            prevLevel++;
            if (prevRating < ratingByLevel(prevLevel)) {
                isNewRating = true;
                prevRating = ratingByLevel(prevLevel);
            }
            
            
        }else{
            prevLocalStars++;
            prevStars++;
        }
        
        
        menuElement * elementStar = GameScene::gameScene->ratingMenu->getElementByName("star");
        menuElement * elementTask = GameScene::gameScene->ratingMenu->getElementByName("task");
        CCPoint startStar;
        CCPoint startTask;
        if (elementStar && elementTask) {
            startStar = elementStar->startPoint;
            startTask = elementTask->startPoint;
            
            LHSprite * spriteStar = dynamic_cast<LHSprite *>(elementStar->sprite);
            CCLabelBMFont * labelTask = dynamic_cast<CCLabelBMFont *>(elementTask->label);
            if (spriteStar && labelTask) {
                spriteStar->setPosition(startStar);
                spriteStar->setVisible(true);
                
                labelTask->setPosition(startTask);
                labelTask->setVisible(true);
                labelTask->setCString(currentTask->getText().c_str());
                
                spriteStar->runAction(
                                      CCSequence::create(
                                                         CCEaseBackInOut::create(
                                                                                 CCMoveTo::create(0.5,elementStar->endPoint )),
                                                         CCDelayTime::create(0.5),
                                                         CCMoveTo::create(1, nextStarSprite->getPosition()),
                                                         CCHide::create(),
                                                         CCCallFuncN::create(this, callfuncN_selector(UserRating::addingTaskStarStep2)),
                                                         NULL
                                                         )
                                      );
                spriteStar->runAction(
                                      CCSequence::create(
                                                         CCDelayTime::create(1),
                                                         CCRotateTo::create(1, 720),
                                                         
                                                         NULL
                                                         )
                                      );
                spriteStar->runAction(
                                      CCSequence::create(
                                                         CCDelayTime::create(1),
                                                         CCScaleTo::create(0.5, 2),
                                                         CCScaleTo::create(0.5, 1),
                                                         NULL
                                                         )
                                      );
                
                
                labelTask->runAction(
                                     CCSequence::create(
                                                        CCEaseBackInOut::create(
                                                                                CCMoveTo::create(0.5,elementTask->endPoint )),
                                                        CCDelayTime::create(0.5),
                                                        CCEaseBackIn::create(CCMoveTo::create(1, endTaskLabelPoint)),
                                                        NULL
                                                        )
                                     );
                
            }
            
        }

    }else{
        onAfterRatingShown();
    }
    
    
}
void UserRating::addingTaskStarStep2(CCObject * object)
{
    if (isNewLevel) {
        for (int i=0; i < starCenters.size(); i++) {

            starCenters[i]->setVisible(true);
            starCenters[i]->setOpacity(255);
            starCenters[i]->setFrame(0);
            starCenters[i]->playAnimation();
            
        }
    }else
    if (nextStarSprite) {
        nextStarSprite->setVisible(true);
        nextStarSprite->setOpacity(255);
        nextStarSprite->setFrame(0);
        nextStarSprite->playAnimation();
    }
    
    if(nextStarSprite)
    {
        nextStarSprite->runAction(
                                  CCSequence::create(
                                                     CCScaleTo::create(0.4, 0.8),
                                                     CCScaleTo::create(0.4, 1),
                                                     CCCallFuncN::create(this, callfuncN_selector(UserRating::addingTaskStarStep3)),
                                    NULL
                                  )
        );
        
        if (isNewLevel) {
            for (int i=0; i < starCenters.size(); i++) {
                
                starCenters[i]->runAction(
                                            CCSequence::create(
                                                               CCDelayTime::create(0.8),
                                                               CCFadeOut::create(0.4),
                                                               NULL
                                                               )
                                          );
                
            }
            CCLabelBMFont * labelLevel  = GameScene::gameScene->ratingMenu->getLabelByName("level");
            if (labelLevel) {
                //char levelStr[10];
                //sprintf(levelStr, "%d", prevLevel);
                //labelLevel->setCString(levelStr);
                labelLevel->runAction(
                                      CCSequence::create(
                                                         CCDelayTime::create(0.8),
                                                         CCScaleTo::create(0.4, 0.1),
                                                         CCScaleTo::create(0.3, 3),
                                                         CCScaleTo::create(0.2, 1),
                                                         NULL
                                                         )
                );
            }
            if (isNewRating) {
                LHSprite *tmpSprite = NULL;
                menuElement * element = GameScene::gameScene->ratingMenu->getElementByName("icon");
                if (element) {
                    if(element->isVisible){
                        tmpSprite = dynamic_cast<LHSprite*>(element->sprite);
                        if (tmpSprite) {
                            tmpSprite->runAction(
                                                 CCSequence::create(
                                                                    /*CCEaseExponentialIn::create( */CCMoveTo::create(0.8,element->startPoint)/*)*/,
                                                                    NULL
                                                                    )
                            );
                        }
                    }
                }
                
                element = GameScene::gameScene->ratingMenu->getElementByName("label");
                if (element) {
                    if(element->isVisible){
                        tmpSprite = dynamic_cast<LHSprite*>(element->sprite);
                        if (tmpSprite) {
                            tmpSprite->runAction(
                                                 CCSequence::create(
                                                                    /*CCEaseExponentialIn::create( */CCMoveTo::create(0.4,element->startPoint)/*)*/,
                                                                    NULL
                                                                    )
                                                 );

                        }
                    }
                }
            }//isNewRating
            
        }
    }
    
}

void UserRating::addingTaskStarStep3(CCObject * object)
{
    if (isNewLevel)
    {
        CCLabelBMFont * labelLevel  = GameScene::gameScene->ratingMenu->getLabelByName("level");
        
        if (labelLevel) {
            char levelStr[10];
            sprintf(levelStr, "%d", prevLevel);
            labelLevel->setCString(levelStr);
        }
        
        if (isNewRating) {
            LHSprite *tmpSprite = NULL;
            menuElement * element = GameScene::gameScene->ratingMenu->getElementByName("icon");
            if (element) {
                element->isVisible = true;
                if(element->isVisible){
                    tmpSprite = dynamic_cast<LHSprite*>(element->sprite);

                    if (tmpSprite) {
                        tmpSprite->setVisible(true);                        
                        tmpSprite->prepareAnimationNamed("icon", "rating.pshs");
                        tmpSprite->setFrame(prevRating-1);
                        tmpSprite->runAction(
                                             CCSequence::create(
                                                                CCMoveTo::create(0.5,element->endPoint),
                                                                NULL
                                                                )
                                             );
                        
                    }
                }
            }
            
            element = GameScene::gameScene->ratingMenu->getElementByName("label");
            if (element) {
                element->isVisible = true;
                if(element->isVisible){
                    tmpSprite = dynamic_cast<LHSprite*>(element->sprite);
                    if (tmpSprite) {
                        tmpSprite->setVisible(true);
                        tmpSprite->prepareAnimationNamed("label", "rating.pshs");
                        tmpSprite->setFrame(prevRating-1);
                        tmpSprite->runAction(
                                             CCSequence::create(
                                                                CCMoveTo::create(0.8,element->endPoint),
                                                                CCCallFuncN::create(this, callfuncN_selector(UserRating::addingTaskStar)),
                                                                NULL
                                                                )
                                             );
                    }
                }
            }
        }//isNewRating
        else{
            addingTaskStar(object);
        }
        
        
    }else{
        addingTaskStar(object);
    }
}

void UserRating::onAfterShowRatingMenu(CCObject * object)
{
    /// запуск действий и анимаций
    addingTaskStar(object);
}
void UserRating::onAfterRatingShown(void)
{
    /// запуск завершающих действий....появление кнопки далее и т.п.
    float moveDistance = 0;
    menuElement * tmpElement = GameScene::gameScene->ratingMenu->getElementByName("resume");
    if (tmpElement) {
        LHSprite * sprite =dynamic_cast<LHSprite *>( tmpElement->sprite );
        if (sprite) {
            moveDistance = sprite->boundingBox().size.height;
            sprite->setPosition(tmpElement->startPoint);
            sprite->setVisible(true);
            sprite->runAction(CCMoveTo::create(1, tmpElement->endPoint));
        }
    }
    
    for (int i=0; i<movingSprites.size(); i++) {
        if (movingSprites[i]) {
            movingSprites[i]->runAction(CCMoveBy::create(0.5, ccp(0,moveDistance)));
        }
    }
    
    tmpElement = GameScene::gameScene->ratingMenu->getElementByName("pruzhina");
    if (tmpElement) {
        LHSprite * sprite =dynamic_cast<LHSprite *>( tmpElement->sprite );
        if (sprite) {
            sprite->runAction(CCMoveBy::create(0.5, ccp(0,-2 * moveDistance)));
        }
    }

}

void UserRating::onNextButton(CCObject * object)
{
     GameScene::gameScene->ratingMenu->hideMenu(0.1);

    
    if (showRatingFrom == 0) {
        GameScene::gameScene->gameoverMenu->showMenu(0.2);
        GameScene::gameScene->pauseButton->setEnabled(false);
    }
    if (showRatingFrom == 1) {
        GameScene::gameScene->resumePlay();
        GameScene::gameScene->pauseButton->setEnabled(true);
        GameScene::gameScene->restartGame();
    }
}

void UserRating::onNewRating(int rating)
{
    
}
void UserRating::onNewStar  (int star)
{
    
}
void UserRating::onNewLevel (int level)
{
    
}
