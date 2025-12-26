//
//  FlyTask.cpp
//  cosmix
//
//  Created by denver on 23.09.13.
//
//

#include "FlyTask.h"
#include "GameScene.h"

CCPoint  FlyTask::pntStartTaskCompleted;
CCPoint  FlyTask::pntEndTaskCompleted;
CCPoint  FlyTask::pntCenterTaskCompleted;
CCPoint  FlyTask::pntStartStar;
CCPoint  FlyTask::pntEndStar;
CCPoint  FlyTask::pntCenterStar;
CCPoint  FlyTask::pntStartText;
CCPoint  FlyTask::pntEndText;
CCPoint  FlyTask::pntCenterText;

//---------

FlyTask::FlyTask(CTask * _task, float delay)
{
    task = _task;
    label = CCLabelBMFont::create(task->getText().c_str(), "menu.fnt");
    label->setAlignment(kCCTextAlignmentLeft);
    label->setPosition(FlyTask::pntStartText);
    label->setAnchorPoint(ccp(0,0.5));
    Game::getSubMenuLayer()->addChild(label);
    
    starSprite = LHSprite::spriteWithName("star0002", "menu", "ui.pshs");
    if (starSprite) {
        starSprite->setPosition(FlyTask::pntStartStar);
        Game::getSubMenuLayer()->addChild(starSprite);
    }
    
    
    //CCCallFuncN *   funcAction1      = CCCallFuncN::create(this, callfuncN_selector(FlyTask::endFlyOfTask));
    CCCallFuncN *   funcAction2      = CCCallFuncN::create(this, callfuncN_selector(FlyTask::endFlyOfTask));
    
    float longDelay = delay + 1.5;
    
    
    label->runAction(
                     CCSequence::create(
                                        CCDelayTime::create(delay),
                                        CCEaseBackInOut::create(CCMoveTo::create(0.5,FlyTask::pntCenterText)),
                                        CCDelayTime::create(1),
                                        CCFadeOut::create(1),
                                        NULL)
                     
                     );
    
    label->runAction(CCSequence::create(
                                        CCDelayTime::create(longDelay),
                                        CCEaseBackInOut::create(CCMoveTo::create(1.5,FlyTask::pntEndText)),
                                        NULL
                        )
                     );
    
    starSprite->runAction(
                     CCSequence::create(
                                        CCDelayTime::create(delay),
                                        CCEaseBackInOut::create(CCMoveTo::create(0.5,FlyTask::pntCenterStar)),
                                        CCDelayTime::create(1),
                                        CCFadeOut::create(2),
                                        funcAction2,
                                        NULL)
                     );

    starSprite->runAction(CCSequence::create(
                                        CCDelayTime::create(longDelay),
                                        CCEaseBackInOut::create(CCMoveTo::create(1,FlyTask::pntEndStar)),
                                        NULL
                                        )
                     );
    starSprite->runAction(CCSequence::create(
                                             CCDelayTime::create(longDelay),
                                             CCScaleTo::create(2, 3),
                                             NULL
                                             )
                          );
    starSprite->runAction(CCSequence::create(
                                             CCDelayTime::create(longDelay),
                                             CCRotateBy::create(2, 360),
                                             NULL
                                             )
                          );
    
    
                     
//    (task->getText().c_str(), "menu.fnt", 0, kCCTextAlignmentLeft, 0);
    
    
    //task->getText();
}

FlyTask::~FlyTask()
{
    if (label) {
        
        label = NULL;
    }
    if (starSprite) {
        starSprite->removeSelf();
        starSprite = NULL;
    }
}

void FlyTask::endFlyOfTask(CCNode * node)
{
    if (task) {
        if (task->award>0) {
            GameScene::gameScene->coinsGetIt(FlyTask::pntEndStar,task->award);
        }
    }
    delete this;
}


void FlyTask::initWithMenu(PopupMenu * menu)
{
    LHSprite * tmpSprite = NULL;
    tmpSprite = menu->LHLoader->spriteWithUniqueName("start_task_completed");
    if (tmpSprite) {
        FlyTask::pntStartTaskCompleted = tmpSprite->getPosition();
        tmpSprite->removeSelf();
    }
    tmpSprite = menu->LHLoader->spriteWithUniqueName("end_task_completed");
    if (tmpSprite) {
        FlyTask::pntEndTaskCompleted = tmpSprite->getPosition();
        tmpSprite->removeSelf();
    }
    tmpSprite = menu->LHLoader->spriteWithUniqueName("center_task_completed");
    if (tmpSprite) {
        FlyTask::pntCenterTaskCompleted = tmpSprite->getPosition();
        tmpSprite->removeSelf();
    }
    
    
    
    menuElement * me = menu->getElementByName("star1");
    if (me) {
        FlyTask::pntStartStar = me->endPoint;
        FlyTask::pntEndStar = FlyTask::pntEndTaskCompleted;
        FlyTask::pntCenterStar = me->endPoint;
        
        FlyTask::pntStartStar.y = FlyTask::pntStartTaskCompleted.y;
        FlyTask::pntEndStar.y = FlyTask::pntCenterTaskCompleted.y;
        FlyTask::pntCenterStar.y = FlyTask::pntCenterTaskCompleted.y;
        
    }
    me = menu->getElementByName("task1");
    if (me) {
        FlyTask::pntStartText = me->endPoint;
        FlyTask::pntEndText = me->endPoint;
        FlyTask::pntCenterText = me->endPoint;
        
        FlyTask::pntStartText.y = FlyTask::pntStartTaskCompleted.y;
        FlyTask::pntEndText.y = FlyTask::pntEndTaskCompleted.y;
        FlyTask::pntCenterText.y = FlyTask::pntCenterTaskCompleted.y;
    }
    
}