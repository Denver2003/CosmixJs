//
//  popupMenu.cpp
//  cosmix
//
//  Created by denver on 03.04.13.
//
//

#include "popupMenu.h"
#include "Game.h"
#include "Test.h"

PopupMenu::PopupMenu(string FileName, bool isSubMenu )
{
    lhFileName = FileName;
    
    LHLoader = new LevelHelperLoader(FileName.c_str());
    if (isSubMenu) {
        LHLoader->addObjectsToWorld(Game::getWorld(), Game::getSubMenuLayer());
    }else{
        LHLoader->addObjectsToWorld(Game::getWorld(), Game::getMenuLayer());
    }
    

    isShowing       = false;
    onShowFunc      = NULL;
    onShowHandler   = NULL;
    onHideFunc      = NULL;
    onHideHandler   = NULL;
    onEndShowFunc      = NULL;
    onEndShowHandler   = NULL;
    onEndHideFunc      = NULL;
    onEndHideHandler   = NULL;

    
    // LOAD POPUP ITEMS
    
    CCArray* popupItems = LHLoader->spritesWithTag(POPUP_ITEM);
    if (popupItems) {
        for (int i = 0; i < popupItems->count(); i++) {
            LHSprite * sprite
                = dynamic_cast<LHSprite *>((LHSprite *)popupItems->objectAtIndex(i));
            if (sprite) {
                menuElement * element = new menuElement();
                
                element->spriteName = sprite->getUniqueName();
                element->delay      = 0;
                element->endPoint   = sprite->getPosition();
                element->startPoint = sprite->getPosition();
                element->sprite     = (CCNode *)sprite;
                element->label      = NULL;
                element->name       = "";
                element->isVisible = false;
                if (sprite->isVisible()) {
                    element->isVisible = true;
                }
                sprite->setVisible(false);

                LHSprite *spriteEnd = LHLoader->spriteWithUniqueName( "start_" + element->spriteName);
                if (spriteEnd) {
                    element->startPoint = spriteEnd->getPosition();
                    spriteEnd->removeSelf();
                }
                
                element->button = NULL;
                
                if (sprite->userInfoClassName() == "popupItem") {
                    popupItem * pi      = (popupItem *)sprite->userInfo();
                    element->delay      = pi->delay;
                    element->delayHide      = pi->delayHide;
                    element->showType   = pi->getShowType();
                    element->name       = pi->buttonName;
                    
                    if (pi->getIsButton()) {
                        
                        element->button = new Button( element->spriteName, pi->getButtonName() , pi->getButtonSheet(), NULL, NULL,LHLoader);
                        element->button->setPressType(PRESSTYPE_ON_DOWN);
                    }
                    if (pi->getIsLabel()) {
                        element->label = CCLabelBMFont::create(pi->getValue().c_str(), pi->getFontName().c_str());
                        element->label->setPosition(sprite->getPosition());

                        element->label->setAnchorPoint(ccp(0,0.5));
                        if (pi->align == "center") {
                            element->label->setAnchorPoint(ccp(0.5,0.5));
                        }else
                        if (pi->align == "right") {
                            element->label->setAnchorPoint(ccp(1,0.5));
                        }
                        if (isSubMenu) {
                            Game::getSubMenuLayer()->addChild(element->label);
                        }else{
                            Game::getMenuLayer()->addChild(element->label);
                        }
                        element->sprite = (CCNode *)element->label;
                        sprite->removeSelf();
                    }
                    element->sprite->setVisible(false);
                }
                elements.push_back(element);
            }
        }
    }
    // LOAD POPUP sliding

}

void PopupMenu::setOnShowFunc(CCObject * handler, SEL_CallFuncO func)
{
    onShowFunc = func;
    onShowHandler = handler;
}
void PopupMenu::setOnHideFunc(CCObject * handler, SEL_CallFuncO func)
{
    onHideFunc = func;
    onHideHandler = handler;
    
}
void PopupMenu::setOnEndShowFunc(CCObject * handler, SEL_CallFuncO func)
{
    onEndShowFunc = func;
    onEndShowHandler = handler;
}
void PopupMenu::setOnEndHideFunc(CCObject * handler, SEL_CallFuncO func)
{
    onEndHideFunc = func;
    onEndHideHandler = handler;
    
}


PopupMenu::~PopupMenu()
{
    
}

int PopupMenu::addSpriteName(string spriteName,float delay, Button * button)
{
    menuElement * element = new menuElement();
    
    element->spriteName = spriteName;
    element->delay = delay;
    if (LHLoader) {

        LHSprite * sprite = LHLoader->spriteWithUniqueName(spriteName);
        if (sprite) {
            element->endPoint    = sprite->getPosition();
            element->startPoint  = sprite->getPosition();
            element->sprite      = sprite;
            sprite->setVisible(false);
            
            LHSprite *spriteEnd = LHLoader->spriteWithUniqueName( "start_" + spriteName);
            if (spriteEnd) {
                element->startPoint = spriteEnd->getPosition();
                spriteEnd->removeSelf();
            }
        }
    }
    
    if (button) {
        element->button = button;
    }
    
    elements.push_back(element);
    return elements.size()-1;
}

void PopupMenu::showMenu(float time)
{
    if (isShowing) {
        return;
    }
    
    TESTLOGFLIGHT("PopupMenu::showMenu(%f)",time);
    
    isShowing = true;
    // run callback function
    if (onShowHandler && onShowFunc) {
        (onShowHandler->*onShowFunc)((CCObject*)this);
    }

    CCNode * firstSprite = NULL;
    float maxDelay = 0;
    
    
    for (vector<menuElement *>::iterator It = elements.begin(); It != elements.end(); It++) {
        menuElement * element = (*It);
        if (element) {
            if (element->isVisible) {
                if (!firstSprite) {
                    firstSprite = element->sprite;
                }
                
                maxDelay = maxDelay > element->delay ? maxDelay : element->delay;
                
                element->sprite->stopAllActions();
                element->sprite->setPosition(element->startPoint);
                
                if (element->button) {
                    element->button->update();
                }
                
                if (element->showType == SHOWTYPE_MOVING) {
                    element->sprite->setVisible(true);
                    
                    element->sprite->runAction(
                                               CCSequence::create(
                                                                  CCDelayTime::create(element->delay),
                                                                  CCEaseBackOut::create(CCMoveTo::create(time,element->endPoint)),
                                                                  NULL)
                                               
                                               );
                    
                }
                if (element->showType == SHOWTYPE_FADING) {
                    element->sprite->setScale(4);
                    element->sprite->runAction(
                                               CCSequence::create(
                                                                  CCDelayTime::create(element->delay),
                                                                  CCShow::create(),
                                                                  CCEaseBackOut::create(CCScaleTo::create(time,1)),
                                                                  
                                                                  NULL)
                                               
                                               );
                    
                }
                
            }else{
                element->sprite->setVisible(false);
            }
        }
    }

    firstSprite->runAction(
                           CCSequence::create(
                                              CCDelayTime::create(maxDelay + time),
                                              CCCallFuncN::create(this, callfuncN_selector(PopupMenu::endOfShow)),
                                              NULL
                                              )
                           );
    
    
    
}

void PopupMenu::hideMenu(float time)
{
    if (!isShowing) {
        return;
    }
    isShowing = false;
    // run callback function
    if (onHideHandler && onHideFunc) {
        (onHideHandler->*onHideFunc)((CCObject*)this);
    }

    CCNode * firstSprite = NULL;
    float maxDelay = 0;
    for (vector<menuElement *>::iterator It = elements.begin(); It != elements.end(); It++) {
        menuElement * element = (*It);
        if (element) {
            if (element->isVisible) {
                if (!firstSprite) {
                    firstSprite = element->sprite;
                }
                
                maxDelay = maxDelay > element->delayHide ? maxDelay : element->delayHide;
                element->sprite->stopAllActions();
                element->sprite->setPosition(element->endPoint);
                //element->sprite->setVisible(true);
                
                if (element->showType == SHOWTYPE_MOVING) {
                    element->sprite->runAction(
                                               CCSequence::create(
                                                                  CCDelayTime::create(element->delayHide),
                                                                  CCEaseBackIn::create(
                                                                                       CCMoveTo::create(time,element->startPoint)
                                                                                       ),
                                                                  
                                                                  
                                                                  NULL
                                                                  )
                                               );
                }
                if (element->showType == SHOWTYPE_FADING) {
                    element->sprite->runAction(
                                               CCSequence::create(
                                                                  CCDelayTime::create(element->delayHide),
                                                                  CCEaseBackIn::create(CCScaleTo::create(time,5)),
                                                                  CCHide::create(),
                                                                  NULL
                                                                  )
                                               );
                }
            }else{
                element->sprite->setVisible(false);
            }

            
        }
    }
    
    firstSprite->runAction(
                           CCSequence::create(
                                              CCDelayTime::create(maxDelay + time),
                                              CCCallFuncN::create(this, callfuncN_selector(PopupMenu::endOfHide)),
                                              NULL
                                              )
                           );
    
    
}

void PopupMenu::endOfHide(CCNode * node)
{
    for (vector<menuElement *>::iterator It = elements.begin(); It != elements.end(); It++) {
        menuElement * element = (*It);
        if (element) {
            if (element->sprite) {
                element->sprite->setVisible(false);
            }
        }
    }
    if (onEndHideHandler && onEndHideFunc) {
        (onEndHideHandler->*onEndHideFunc)((CCObject*)this);
    }
    
}

void PopupMenu::endOfShow(CCNode * node)
{
    if (onEndShowHandler && onEndShowFunc) {
        (onEndShowHandler->*onEndShowFunc)((CCObject*)this);
    }
}

LevelHelperLoader * PopupMenu::getLoader()
{
    return LHLoader;
}

Button * PopupMenu::getButtonByName(string buttonName)
{
    Button * button = NULL;
    for (vector<menuElement *>::iterator It = elements.begin(); It != elements.end(); It++) {
        menuElement * element = (*It);
        if (element) {
            if (element->button) {
                if( element->name == buttonName ){
                    button = element->button;
                    break;
                }
            }
        }
    }
    return button;
    
}

menuElement * PopupMenu::getElementByName(string _Name)
{
    menuElement * elem = NULL;
    for (vector<menuElement *>::iterator It = elements.begin(); It != elements.end(); It++) {
        menuElement * element = (*It);
        if (element) {
            if( element->name == _Name ){
                elem = element;
                break;
            }
        }
    }
    return elem;
    
}

CCLabelBMFont * PopupMenu::getLabelByName(string buttonName)
{
    CCLabelBMFont * label = NULL;
    for (vector<menuElement *>::iterator It = elements.begin(); It != elements.end(); It++) {
        menuElement * element = (*It);
        if (element) {
            if (element->label) {
                if( element->name == buttonName ){
                    label = element->label;
                    break;
                }
            }
        }
    }
    return label;
    
}

bool PopupMenu::setLabelText(string labelName, string text)
{
    CCLabelBMFont * label = getLabelByName(labelName);
    if (label) {
        label->setString(text.c_str());
        return true;
    }
    
    return false;
}
