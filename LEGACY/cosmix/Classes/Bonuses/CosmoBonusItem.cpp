//
//  CosmoBonusItem.cpp
//  cosmix
//
//  Created by Denis Khlopin on 21.10.13.
//
//

#include "CosmoBonusItem.h"
#include "CosmoBonuses.h"

CosmoBonusItem::CosmoBonusItem(int _type)
{
    type            = _type;
    state           = CBI_STATE_READY;
    saveName        = "";
    buttonSprite    = NULL;
    waitingSprite   = NULL;
    isCooldown      = false;
    LevelHelperLoader * loader = GameScene::gameScene->loader;
    switch (type) {
        case BT_MEGABOMB:
            saveName = "cbi_cosmobomb";
            spriteName = "bonus3";
            break;
        case BT_TOUCH_TO_KILL:
            saveName = "cbi_touchtokill";
            spriteName = "bonus1";
            break;
        case BT_GUN:
            saveName = "cbi_cosmogun";
            spriteName = "bonus2";
            break;
        default:
            break;
    }
    if (loader) {
        buttonSprite = loader->spriteWithUniqueName(spriteName);
        buttonSprite->setVisible(false);

        counterLabel = CCLabelBMFont::create("0", "menu.fnt");
        buttonSprite->getParent()->addChild(counterLabel,buttonSprite->getZOrder());
        
        waitingSprite = loader->spriteWithUniqueName("cooldown");
        waitingSprite->setVisible(false);
        waitingSprite->prepareAnimationNamed("bonus_cooldown", "sprites.pshs");
        waitingSprite->setFrame(0);
    }
}

CosmoBonusItem::~CosmoBonusItem()
{
    
}

void CosmoBonusItem::load()
{
    count = CCUserDefault::sharedUserDefault()->getIntegerForKey(saveName.c_str(),0);
}
void CosmoBonusItem::save()
{
    CCUserDefault::sharedUserDefault()->setIntegerForKey(saveName.c_str(),count);
}
void CosmoBonusItem::setSlot(CosmoBonusSlot * _slot)
{
    slot = _slot;
    if (slot) {
        //make something
    }
}
void CosmoBonusItem::onStartGame()
{
    load();
    isCooldown      = false;
    cooldownCurrent = 0;
}
void CosmoBonusItem::onFinishGame()
{
    save();
}
void CosmoBonusItem::update(float dt)
{
    if (isCooldown) {
        cooldownCurrent-=dt;
        if (cooldownCurrent<=0) {
            isCooldown = false;
            
        }
        
    }
}
void CosmoBonusItem::updateState()
{
    state = CBI_STATE_READY;
    if (count<=0) {
        state = CBI_STATE_NOTHING;
        if (!slot) {
            if (buttonSprite) {
                buttonSprite->setVisible(false);
            }
            if (waitingSprite) {
                waitingSprite->setVisible(false);
            }
        }
    }else{
        if (slot) {
            if (buttonSprite) {
                buttonSprite->setVisible(true);
            }
        }
    }
    
    if (count<=1) {
        if (counterLabel&&!slot) {
            counterLabel->setVisible(false);
        }
    }else{
        if (counterLabel&&slot) {
            char temp[12];
            sprintf(temp, "%i",count);
            counterLabel->setVisible(true);
            counterLabel->setString(temp);
        }
    }
    if (isCooldown) {
        state = CBI_STATE_COOLDOWN;
        if (slot) {
            if (waitingSprite) {
               // waitingSprite->setVisible(true);
            }
        }
    }else{
        if (waitingSprite) {
            waitingSprite->setVisible(false);
        }
    }
}

void CosmoBonusItem::useItem()
{
    if (state == CBI_STATE_READY) {
        //we use a bonus
        //then we will start countdown cooldown time
        if (count>0) {
            count--;
            switch (type) {
                case BT_MEGABOMB:
                    break;
                case BT_TOUCH_TO_KILL:
                    break;
                case BT_GUN:
                    break;
                default:
                    break;
            }
            if (buttonSprite) {
                buttonSprite->runAction(
                                        CCSequence::create
                                            (
                                                CCScaleTo::create(0.3, 1.5, 0.7),
                                                CCScaleTo::create(0.3, 0.8, 1.2),
                                                CCScaleTo::create(0.3, 1, 1),
                                                CCCallFuncN::create(this, callfuncN_selector(CosmoBonusItem::onEndTouch)),
                                                NULL
                                            )
                                        );
                            }
            
            if (count>0) {
                //start cooldown
                cooldownCurrent = cooldownTime;
                isCooldown = true;
                
                state = CBI_STATE_COOLDOWN;
            }else{
                state = CBI_STATE_NOTHING;
            }
        }
        
    }
    
}
void CosmoBonusItem::onEndTouch(CCObject * object)
{
    if (count>0) {
        //start cooldown
        if (slot) {
            if (waitingSprite) {
                waitingSprite->setVisible(true);
            }
        }
    }
    
}


