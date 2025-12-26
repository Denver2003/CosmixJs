//
//  CosmoBonuses.cpp
//  cosmix
//
//  Created by Denis Khlopin on 21.10.13.
//
//

#include "CosmoBonuses.h"
#include "AliensManager.h"
#include "PlayEvents.h"
#include "Test.h"


//---------------------------//---------------------------//---------------------------
// CosmoBonus::CosmoBonus
//---------------------------//---------------------------//---------------------------
CosmoBonus::CosmoBonus(int _type, int _frame,float _cooldownTime)
{
    type    = _type;
    count   = 0;
    frame   = _frame;
    isCooldown = false;
    coolDownTime = _cooldownTime;
    coolDownTimeRemaining = 0;
    //Bonus * bonus = Bonus::findByType(type);
    //if (bonus) {
        info = "";
    //}
    
    switch (type) {
        case BT_MEGABOMB:
            name="BTMEGABOMB";
            break;
        case BT_TOUCH_TO_KILL:
            name="BTTOUCHTOKILL";
            break;
        case BT_GUN:
            name="BTGUN";
            break;
            
        default:
            break;
    }

    
}
CosmoBonus::~CosmoBonus()
{
    
}
//---------------------------//---------------------------//---------------------------
// ActiveBonus - активизированный бонус
//---------------------------//---------------------------//---------------------------
ActiveBonus::ActiveBonus(){
    elapsedTime = 0;
    isActive    = false;
    type        = -1;
    isActive    = false;
    
    LHLayer * mLayer = GameScene::gameScene->loader->layerWithUniqueName("MAIN_LAYER");
    LHBatch * batch = mLayer->batchWithUniqueName("items");

    
    label = CCLabelBMFont::create("0:00", "menu.fnt");
    if (label) {
        label->setPosition(CosmoBonuses::getInstance()->activeLabelPoint);
        label->setVisible(false);
        
    }
    
    
    sprite = LHSprite::spriteWithName("bonuses0004", "items", "sprites.pshs");
    if (sprite) {
        sprite->setPosition(CosmoBonuses::getInstance()->activeIconPoint);
        sprite->setVisible(false);
        sprite->prepareAnimationNamed("bonus_icons", "sprites.pshs");
        
    }

    mLayer->addChild(label,6);
    batch->addChild(sprite);
}

ActiveBonus::~ActiveBonus(){
    
}
void ActiveBonus::init()
{
    elapsedTime = 0;
    isActive    = false;
    type        = -1;
    count       = 0;
    if (label) {
        label->setPosition(CosmoBonuses::getInstance()->activeLabelPoint);
        label->setVisible(false);
    }
    
    
    if (sprite) {
        sprite->setPosition(CosmoBonuses::getInstance()->activeIconPoint);
        sprite->setVisible(false);
        sprite->prepareAnimationNamed("bonus_icons", "sprites.pshs");
        
    }

    
}
void ActiveBonus::updateLabel()
{
    int seconds = (int)elapsedTime;
    char str[10];
    if (seconds>=10) {
        sprintf(str, "0:%i",seconds);
    }else if(seconds<10){
        sprintf(str, "0:0%i",seconds);
    }
    if (label) {
        label->setString(str);
    }
}

void ActiveBonus::start(int _type, float tm)
{
    type        = _type;
    elapsedTime = tm;
    isActive    = true;
    count       = 10;
    switch (type) {
        case BT_MEGABOMB:
            elapsedTime = 6;
            count       = 14;
            bombIndex   = -1;
            PlayEvents::getInstance()->onUseCosmoBombBonus();
            break;
        case BT_TOUCH_TO_KILL:
            elapsedTime = 8;
            count       = 13;
            PlayEvents::getInstance()->onUseTouchToKillBonus();
            break;
        case BT_GUN:
            elapsedTime = 3;
            count       = 15;
            bombIndex   = -1;
            PlayEvents::getInstance()->onUseGunBonus();
            break;
            
        default:
            break;
    }
    fullTime = elapsedTime;
    
    CosmoBonus * cosmoBonus = CosmoBonuses::getInstance()->getBonusByType(type);
    if (cosmoBonus) {
        if (sprite) {
            sprite->setFrame(cosmoBonus->frame);
            sprite->cocos2d::CCNode::setVisible(true);
            sprite->setScale(1);
            sprite->setPosition(CosmoBonuses::getInstance()->startActiveIconPoint);
            
            //бесконечная вибрация иконки
            sprite->runAction(CCRepeatForever::create(
                                                      (CCActionInterval*)CCSequence::create(
                                                                         CCScaleTo::create(0.2, 1.4),
                                                                         CCScaleTo::create(0.4, 0.9),
                                                                         NULL
                                                      )
                              ));
            sprite->runAction(CCMoveTo::create(0.5, CosmoBonuses::getInstance()->activeIconPoint));
            
        }
    }
    
    if (label) {
        label->setVisible(true);
        updateLabel();
        label->setPosition(CosmoBonuses::getInstance()->startActiveLabelPoint);
        
        label->runAction(CCMoveTo::create(0.5, CosmoBonuses::getInstance()->activeLabelPoint));
        
    }
    
   /* Bonus * bonus = Bonus::findByType(type);
    if (bonus) {
        if (bonus->info!="") {
            LHLayer * mLayer = GameScene::gameScene->loader->layerWithUniqueName("MAIN_LAYER");
            CCLabelBMFont * infoLabel = CCLabelBMFont::create(bonus->info.c_str(), "menu.fnt" );
            infoLabel->setColor(ccc3(200,0,0));
            mLayer->addChild(infoLabel,6);
            
            //infoLabel->release();
            
        }
    }
  */
}
void ActiveBonus::update(float dt)
{
    if (isActive) {
        elapsedTime-=dt;
        if (elapsedTime<0 || count<=0) {
            destroy();
        }else{
            updateLabel();
            if (type == BT_GUN) {
                int size = CosmoBonuses::getInstance()->bombPoints.size();
                int index = size - (int)((elapsedTime * size)/(fullTime))-1 ;
                if (index != bombIndex) {
                    bombIndex = index;
                    CCPoint bangPoint;
                    
                    if (bombIndex>=0 && bombIndex<size ) {
                        TESTLOG("bombIndex = %i of size=%i",bombIndex,CosmoBonuses::getInstance()->bombPoints.size());
                        bangPoint = CosmoBonuses::getInstance()->bombPoints[bombIndex];
                        
                        AliensManager::getInstance()->checkGunShot(bangPoint);
                        //draw animation
                        LHLayer * mLayer = GameScene::gameScene->loader->layerWithUniqueName("MAIN_LAYER");
                        LHBatch * batch = mLayer->batchWithUniqueName("items");
                        
                        LHSprite * gunShotSprite = LHSprite::spriteWithName("gun_shot", "items", "sprites.pshs");
                        if (gunShotSprite) {
                            gunShotSprite->setPosition(bangPoint);
                            gunShotSprite->setVisible(true);
                            gunShotSprite->setRotation(CCRANDOM_0_1()*360);
                            batch->addChild(gunShotSprite);
                            
                            gunShotSprite->runAction(CCSequence::create(
                                                                        CCDelayTime::create(1),
                                                                        CCFadeOut::create(1.5),
                                                                        CCCallFuncND::create(CosmoBonuses::getInstance(), callfuncND_selector(CosmoBonuses::endOfGunShot),gunShotSprite),
                                                                        NULL
                                                                        ));
                        }
                    }
                }
            }
        }
    }
}
void ActiveBonus::destroy()
{
    if (isActive) {
        type        = -1;
        elapsedTime = 0;
        isActive    = false;
        CosmoBonuses::getInstance()->showBonuses();
    }

    
    if (sprite) {
        //sprite->setVisible(true);
        sprite->runAction(CCSequence::create(
                                             CCMoveTo::create(0.5, CosmoBonuses::getInstance()->startActiveIconPoint),
                                             CCHide::create(),
                                             NULL
                                             )
                          );
    }
    if (label) {
//        label->setVisible(false);
        label->runAction(CCSequence::create(
                                             CCMoveTo::create(0.5, CosmoBonuses::getInstance()->startActiveLabelPoint),
                                             CCHide::create(),
                                             NULL
                                             )
                         );
        
    }
    
}
void ActiveBonus::decCount(int _count)
{
    count-=_count;
}
//---------------------------//---------------------------//---------------------------
// CosmoBonuses::CosmoBonuses()
//---------------------------//---------------------------//---------------------------
CosmoBonuses * CosmoBonuses::mInstance = NULL;

CosmoBonuses::CosmoBonuses()
{
    isShowed = false;
    isHided = true;
    andBackAgain = false;
    isBonusUsingNow = false;

}
CosmoBonuses::~CosmoBonuses()
{
    
}

// static functions
CosmoBonuses * CosmoBonuses::getInstance()
{
    if (!CosmoBonuses::mInstance) {
        CosmoBonuses::mInstance = new CosmoBonuses();
    }
    return CosmoBonuses::mInstance;
}

void CosmoBonuses::destroyInstance()
{
    if (CosmoBonuses::mInstance) {
        delete CosmoBonuses::mInstance;
    }
}

void CosmoBonuses::save()
{
    for (int i=0; i<bonuses.size(); i++) {
        if (bonuses[i]) {
            CCUserDefault::sharedUserDefault()->setIntegerForKey(bonuses[i]->name.c_str(),bonuses[i]->count);
        }
    }
    CCUserDefault::sharedUserDefault()->flush();
}

void CosmoBonuses::load()
{
    for (int i=0; i<bonuses.size(); i++) {
        if (bonuses[i]) {
            bonuses[i]->count = CCUserDefault::sharedUserDefault()->getIntegerForKey(bonuses[i]->name.c_str(),0);
             ///TEMP-----------------
            /*if(bonuses[i]->count == -1){
                bonuses[i]->count = 0;
                bonuses[i]->count = 9; //FOR FIRST TEST
            }*/
            ///TEMP
        }
    }
}

bool CosmoBonuses::isActiveBonus(int type)
{
    if (active) {
        if (active->isActive && active->type == type) {
            return true;
        }
    }
    return false;
}

void CosmoBonuses::onStartGame()
{
    
    Bonus::itWasRare = false;
    isShowed = false;
    isHided = true;
    andBackAgain = false;
    isBonusUsingNow = false;
    if (active) {
        active->init();
    }
    
    for (int i = 0; i < bonuses.size(); i++) {
        bonuses[i]->isCooldown = false;
        bonuses[i]->coolDownTimeRemaining = 0;
    }
    showBonuses();

    for (int i = 0; i < slots.size(); i++) {
        slots[i]->updateCooldownSprite();
    }
    
}

void CosmoBonuses::onEndGame()
{
    hideBonuses(false);
    if (active) {
        active->destroy();
    }
    
    save();
}


void CosmoBonuses::loadInfo(LevelHelperLoader * loader)
{
    /// load bonuses
    CosmoBonus * tempBonus = NULL;
    
    //tempBonus = new CosmoBonus(BT_MEGABOMB,0,500.0);
    //bonuses.push_back(tempBonus);
    tempBonus = new CosmoBonus(BT_TOUCH_TO_KILL,1,240.0);
    bonuses.push_back(tempBonus);
    tempBonus = new CosmoBonus(BT_GUN,3,300.0);
    bonuses.push_back(tempBonus);
    
    ///load slots
    if (loader) {
        char showPoint[20];
        char hidePoint[20];
        char labelPoint[20];
        char cooldownSpriteName[20];
        char rightTopPointStr[] = "start_level";
        CCSize relativeSize;
        
        CCSize ws = CCDirector::sharedDirector()->getWinSize();
        
        LHSprite *temp;
        

        
        temp = loader->spriteWithUniqueName(rightTopPointStr);
        CCPoint rightTopPoint = temp->getPosition();


        relativeSize.width = rightTopPoint.x - ws.width;
        relativeSize.height = rightTopPoint.y - ws.height;
        
        temp = loader->spriteWithUniqueName("bonus_icon");
        if (temp) {
            activeIconPoint.x = temp->getPosition().x - relativeSize.width;
            activeIconPoint.y = temp->getPosition().y - relativeSize.height;
        }
        temp = loader->spriteWithUniqueName("bonus_label");
        if (temp) {
            activeLabelPoint.x = temp->getPosition().x - relativeSize.width;
            activeLabelPoint.y = temp->getPosition().y - relativeSize.height;
        }
        temp = loader->spriteWithUniqueName("start_bonus_icon");
        if (temp) {
            startActiveIconPoint.x = temp->getPosition().x - relativeSize.width;
            startActiveIconPoint.y = temp->getPosition().y - relativeSize.height;
        }
        temp = loader->spriteWithUniqueName("start_bonus_label");
        if (temp) {
            startActiveLabelPoint.x = temp->getPosition().x - relativeSize.width;
            startActiveLabelPoint.y = temp->getPosition().y - relativeSize.height;
        }
        
        active = new ActiveBonus();
        
        for (int i = 1; i <=3; i++) {
            
            sprintf(showPoint, "bonus%i",i);
            sprintf(hidePoint, "start_bonus%i",i);
            sprintf(labelPoint,"label_bonus%i",i);
            sprintf(cooldownSpriteName,"cooldown_bonus%i",i);

            CCSize labelShift;
            
            CosmoBonusSlot * slot = new CosmoBonusSlot(i);
            
            temp = loader->spriteWithUniqueName(showPoint);
            
            slot->showPosition.x = temp->getPosition().x - relativeSize.width;
            slot->showPosition.y = temp->getPosition().y - relativeSize.height;
            
            slot->spriteIcon = temp;
            slot->spriteIcon->setPosition(slot->hidePosition);
            slot->spriteIcon->setVisible(false);
            slot->spriteIcon->prepareAnimationNamed("bonus_buttons", "sprites.pshs");
            slot->spriteIcon->setFrame(0);
            
            temp = loader->spriteWithUniqueName(hidePoint);

            slot->hidePosition.x = temp->getPosition().x - relativeSize.width;
            slot->hidePosition.y = temp->getPosition().y - relativeSize.height;

            temp = loader->spriteWithUniqueName(labelPoint);
            
            slot->showLabelPosition.x = temp->getPosition().x - relativeSize.width;
            slot->showLabelPosition.y = temp->getPosition().y - relativeSize.height;
            
            slot->hideLabelPosition.x = slot->showLabelPosition.x + (slot->hidePosition.x - slot->showPosition.x);
            slot->hideLabelPosition.y = slot->showLabelPosition.y;
            
            temp = loader->spriteWithUniqueName(cooldownSpriteName);
            slot->spriteCooldown = temp;
            slot->spriteCooldown->setPosition(slot->hidePosition);
            slot->spriteCooldown->setVisible(false);
            
            slot->spriteCooldown->prepareAnimationNamed("bonus_cooldown", "sprites.pshs");
            slot->spriteCooldown->setFrame(16);
            
            slot->label = CCLabelBMFont::create("0", "menu.fnt");
            LHLayer * mLayer = loader->layerWithUniqueName("MAIN_LAYER");
            
            mLayer->addChild(slot->label,6);
            slot->label->setPosition(slot->hideLabelPosition);
            
            slots.push_back(slot);
        }
        
        // loading bomb points
        for (int i =1; i <= 14; i++) {
            char bombPointsStr[20];
            sprintf(bombPointsStr, "bomb_point_%i",i);
            temp = loader->spriteWithUniqueName(bombPointsStr);
            if (temp) {
                bombPoints.push_back(temp->getPosition());
                temp->removeSelf();
                temp=NULL;
            }
        }
    }
    load();
}

void CosmoBonuses::updateBonuses()
{
    // clear all slots
    for (int i = 0; i < slots.size(); i++) {
        slots[i]->isEmpty   = true;
        slots[i]->bonus     = NULL;
        
        slots[i]->spriteIcon->setVisible(false);
        slots[i]->label->setVisible(false);
        slots[i]->spriteCooldown->setVisible(false);
        
    }
    int slotIndex = 0;
    for (int i=0; i<bonuses.size(); i++) {
        if (bonuses[i]->count>0) {
            slots[slotIndex]->isEmpty = false;
            slots[slotIndex]->bonus = bonuses[i];
            
            slots[slotIndex]->spriteIcon->setFrame(bonuses[i]->frame);
            slots[slotIndex]->spriteIcon->setVisible(true);
            
            if (bonuses[i]->count > 1) {
                char labelStr[5];
                if (bonuses[i]->count > 9) {
                    sprintf(labelStr, "+");
                }else{
                    sprintf(labelStr, "%i",bonuses[i]->count);
                }
                slots[slotIndex]->label->setVisible(true);
                slots[slotIndex]->label->setString(labelStr);
            }
            
            slots[slotIndex]->updateCooldownSprite();
            slotIndex++;
        }
    }
}
//--------------------------------
void CosmoBonuses::showBonuses()
{
    if (active) {
        if (active->isActive) {
            return;
        };
    }
    
    if (!isShowed && isHided) {
        isHided = false;
        updateBonuses();
        float delay = 0;
        float flytime = 1;
        
        for (int i = 0; i < slots.size(); i++) {
            CosmoBonusSlot * slot = slots[i];
            if (!slot->isEmpty) {
                delay+=0.1;
                //init position of sprites
                slot->spriteIcon->setPosition(slot->hidePosition);
                slot->label->setPosition(slot->hideLabelPosition);
                slot->spriteCooldown->setPosition(slot->hidePosition);
                
                slot->spriteIcon->runAction(
                                            CCSequence::create(
                                                               CCDelayTime::create(delay),
                                                               CCEaseBounceOut::create(CCMoveTo::create(flytime, slot->showPosition)),
                                                               NULL
                                                               
                                            )
                );
                slot->spriteCooldown->runAction(
                                            CCSequence::create(
                                                               CCDelayTime::create(delay),
                                                               CCEaseBounceOut::create(CCMoveTo::create(flytime, slot->showPosition)),
                                                               NULL
                                                               
                                                               )
                                            );
                slot->label->runAction(
                                                CCSequence::create(
                                                                   CCDelayTime::create(delay),
                                                                   CCEaseBounceOut::create(CCMoveTo::create(flytime, slot->showLabelPosition)),
                                                                   NULL
                                                                   
                                                                   )
                                                );
                
                
            }
        }
        if (slots.size()>0) {
            slots[0]->spriteIcon->runAction(
                                        CCSequence::create(
                                                           CCDelayTime::create(delay + flytime),
                                                           CCCallFuncN::create(this, callfuncN_selector(CosmoBonuses::endOfShow)),
                                                           NULL
                                                           
                                                           )
                                            );
        }
    }
}

void CosmoBonuses::endOfShow(CCNode * node)
{
    isShowed = true;
}

void CosmoBonuses::hideBonuses(bool andBack)
{
    if (isShowed && !isHided) {
        if(andBack){
            andBackAgain = true;
        }
        isShowed = false;
        float delay = 0;
        float flytime = 1;
        
        for (int i = 0; i < slots.size(); i++) {
            CosmoBonusSlot * slot = slots[i];
            if (!slot->isEmpty) {
                delay+=0.1;
                //init position of sprites
                slot->spriteIcon->setPosition(slot->showPosition);
                slot->label->setPosition(slot->showLabelPosition);
                slot->spriteCooldown->setPosition(slot->showPosition);
                
                slot->spriteIcon->runAction(
                                            CCSequence::create(
                                                               CCDelayTime::create(delay),
                                                               CCEaseBounceOut::create(CCMoveTo::create(flytime, slot->hidePosition)),
                                                               NULL
                                                               
                                                               )
                                            );
                slot->spriteCooldown->runAction(
                                                CCSequence::create(
                                                                   CCDelayTime::create(delay),
                                                                   CCEaseBounceOut::create(CCMoveTo::create(flytime, slot->hidePosition)),
                                                                   NULL
                                                                   
                                                                   )
                                                );
                slot->label->runAction(
                                       CCSequence::create(
                                                          CCDelayTime::create(delay),
                                                          CCEaseBounceOut::create(CCMoveTo::create(flytime, slot->hideLabelPosition)),
                                                          NULL
                                                          
                                                          )
                                       );
                
                
            }
        }
        if (slots.size()>0) {
            slots[0]->spriteIcon->runAction(
                                            CCSequence::create(
                                                               CCDelayTime::create(delay + flytime),
                                                               CCCallFuncN::create(this, callfuncN_selector(CosmoBonuses::endOfHide)),
                                                               NULL
                                                               
                                                               )
                                            );
        }
    }
}

void CosmoBonuses::endOfHide(CCNode * node)
{
    isHided = true;
    if (andBackAgain) {
        isShowed = false;
        isHided = true;
        showBonuses();
    }
}

CosmoBonus * CosmoBonuses::getBonusByType(int bonusType)
{
    for (int i = 0; i < bonuses.size(); i++) {
        if (bonuses[i]->type == bonusType) {
            return bonuses[i];
        }
    }
    return NULL;
}
CosmoBonusSlot * CosmoBonuses::getSlotByType(int bonusType)
{
    for (int i = 0; i < slots.size(); i++) {
        if (slots[i]->bonus) {
            if (slots[i]->bonus->type == bonusType) {
                return slots[i];
            }
        }
    }
    return NULL;
}

void CosmoBonuses::addBonus(int bonusType,int count,CCPoint pnt,bool animate)
{
    CosmoBonus * bonus = getBonusByType(bonusType);
    CosmoBonusSlot * slot = getSlotByType(bonusType);
    if (bonus) {
        if (animate) {
            CCPoint endPoint;
            
            if (!slot) {
                endPoint = slots[0]->hidePosition;
            }else{
                endPoint = slot->showPosition;
            }
            LHLayer * mLayer = GameScene::gameScene->loader->layerWithUniqueName("MAIN_LAYER");
            LHBatch * batch = mLayer->batchWithUniqueName("items");

            //draw animation
            LHSprite * flySprite = LHSprite::spriteWithName("bonuses0004", "items", "sprites.pshs");
            if (flySprite) {
                flySprite->setPosition(pnt);
                flySprite->prepareAnimationNamed("bonus_icons", "sprites.pshs");
                flySprite->setFrame(bonus->frame);
                
                flySprite->runAction(CCSequence::create(
                                                        CCEaseBackIn::create(CCMoveTo::create(1, endPoint)),
                                                        CCCallFuncND::create(this, callfuncND_selector(CosmoBonuses::endOfFlyAddBonus),flySprite),
                                                        NULL
                                     ));
                
                batch->addChild(flySprite);
            }
        }else{
            
        }
      bonus->count+=count;
        
    }
    if (!slot) {
        isShowed = true;
        isHided = false;
        
        hideBonuses(true);
    }else{
        updateBonuses();
    }
}
void CosmoBonuses::endOfFlyAddBonus(CCNode* node,CCObject * sprite)
{
    LHSprite * sp = dynamic_cast<LHSprite*>(sprite);
    if (sp) {
        sp->setVisible(false);
        sp->removeSelf();
    }
}
void CosmoBonuses::endOfGunShot(CCNode* node,CCObject * sprite)
{
    LHSprite * sp = dynamic_cast<LHSprite*>(sprite);
    if (sp) {
        sp->setVisible(false);
        sp->removeSelf();
    }
}

bool CosmoBonuses::checkTouch(CCPoint touchPoint){
    if (isShowed) {
        for (int i = 0; i < slots.size(); i++) {
            if (slots[i]->bonus) {
                if (!slots[i]->bonus->isCooldown) {
                    if (slots[i]->spriteIcon) {
                        if(slots[i]->spriteIcon->boundingBox().containsPoint(touchPoint)){
                            // touch button

                            useBonus(slots[i]->bonus,slots[i]->spriteIcon->getPosition());
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
}
void CosmoBonuses::useBonus(CosmoBonus * bonus,CCPoint position)
{
    if (bonus) {
        if (bonus->count>0 && !bonus->isCooldown) {
            // animate button
            LHLayer * mLayer = GameScene::gameScene->loader->layerWithUniqueName("MAIN_LAYER");
            LHBatch * batch = mLayer->batchWithUniqueName("items");
            
            LHSprite * flySprite = LHSprite::spriteWithName("bonuses0004", "items", "sprites.pshs");
            if (flySprite) {
                flySprite->setPosition(position);
                flySprite->prepareAnimationNamed("bonus_buttons", "sprites.pshs");
                flySprite->setFrame(bonus->frame);
                
                flySprite->runAction(CCSequence::create(
                                                        CCScaleTo::create(0.1, 1.4),
                                                        CCScaleTo::create(0.3, 1),
                                                        CCDelayTime::create(0.1),
                                                        CCCallFuncND::create(this, callfuncND_selector(CosmoBonuses::endOfFlyAddBonus),flySprite),
                                                        NULL
                                                        ));
                flySprite->runAction(CCSequence::create(
                                                        CCDelayTime::create(0.2),
                                                        CCFadeTo::create(0.3, 0),
                                                        NULL
                                                        ));
                
                
                batch->addChild(flySprite);
            }

            bonus->isCooldown = true;
            bonus->coolDownTimeRemaining = bonus->coolDownTime;
            bonus->count--;

            isShowed = true;
            isHided = false;
            hideBonuses(true);
            
            // активация бонусов!!!!
            if (active) {
                save();
                active->start(bonus->type, 10);
            }
            
        }
    }
}

void CosmoBonuses::update(float dt)
{
    for (int i = 0; i < bonuses.size(); i++) {
        if (bonuses[i]->isCooldown) {
            CosmoBonusSlot * slot = getSlotByType(bonuses[i]->type);
            bonuses[i]->coolDownTimeRemaining -= dt;
            if (bonuses[i]->coolDownTimeRemaining <= 0) {
                bonuses[i]->coolDownTimeRemaining = 0;
                bonuses[i]->isCooldown = false;
            }else{
                
            }
            if (slot) {
                slot->updateCooldownSprite();
            }
        }
    }
    
    if (active) {
        active->update(dt);
    }
}

///--------------------------------------
/// CosmoBonusSlot
///--------------------------------------
CosmoBonusSlot::CosmoBonusSlot(int _count)
{
    count = _count;
    isEmpty = true;
    bonus = NULL;
}
CosmoBonusSlot::~CosmoBonusSlot()
{
    
}
void CosmoBonusSlot::updateCooldownSprite()
{
   
   
    if (bonus) {
        if (bonus->isCooldown) {
            if (!spriteCooldown->isVisible()) {
                spriteIcon->setOpacity(100);
                spriteCooldown->setVisible(true);

            }
            
            int frame = 0;
            if (bonus->coolDownTime>0) {
                frame = (bonus->coolDownTimeRemaining * 16)/bonus->coolDownTime;
            }
            if (frame != spriteCooldown->currentFrame()) {
                spriteCooldown->setFrame(frame);
            }


        }else{
            if (spriteCooldown->isVisible()) {
                spriteCooldown->setVisible(false);
            }
            spriteIcon->setOpacity(250);
        }
    }
}

