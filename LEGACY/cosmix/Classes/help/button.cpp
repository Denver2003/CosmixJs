//
//  button.cpp
//  cosmix
//
//  Created by denver on 23.12.12.
//
//

#include "button.h"
#include "game.h"
#include "shop.h"

Button::Button(string _spriteName, string _buttonName,string _sceneName,CCObject * _handler, SEL_CallFuncO _func, LevelHelperLoader *_loader)
{
    buttonName  = _buttonName;
    sceneName   = _sceneName;
    func        = _func;
    handler     = _handler;
    spriteName  = _spriteName;
    pressType = PRESSTYPE_ON_UP;
    if (spriteName == "") {
        spriteName = buttonName + "_button";
    }
    
    buttonType  = BUTTONTYPE_BUTTON;    
    value       = 0;
    enabled     = true;
    loader      = _loader;
    if (!loader) {
        loader      = Game::getLoader();
    }
    
    sprite = loader->spriteWithUniqueName( spriteName );
    if (sprite) {
        iddleButton();
        sprite->registerTouchBeganObserver(this, callfuncO_selector(Button::touchBegin));
        sprite->registerTouchEndedObserver(this, callfuncO_selector(Button::touchEnd));
        
        CCNotificationCenter::sharedNotificationCenter()->addObserver(
                                    this,
                                    callfuncO_selector(Button::spriteAnimHasEnded),
                                    LHAnimationHasEndedAllRepetitionsNotification,
                                    sprite
                                                                      );
        
        touchRect = sprite->boundingBox();
        
    }
    buttonIndex = ButtonManager::getInstance()->addButton(this);
}

Button::~Button()
{
    CCNotificationCenter::sharedNotificationCenter()->removeObserver(
                                    this,
                                    LHAnimationHasEndedAllRepetitionsNotification
                                                                     );
    ButtonManager::getInstance()->removeButton(buttonIndex);
}
void Button::setActionFunction(CCObject * _handler,SEL_CallFuncO _func)
{
    func        = _func;
    handler     = _handler;
}

void Button::pressButton()
{
    if (sprite) {
        sprite->prepareAnimationNamed( buttonName + "_down", sceneName );
        sprite->playAnimation();
    }
}

void Button::releaseButton()
{
    if (sprite) {
        sprite->prepareAnimationNamed( buttonName + "_pressed", sceneName );
        sprite->playAnimation();
    }
}

void Button::iddleButton()
{
    if (sprite) {
        sprite->prepareAnimationNamed( buttonName + "_idle", sceneName );
        sprite->playAnimation();
    }
    
}

void Button::touchBegin(CCNode * object)
{
    if (Shop::getInstance()->shopIsActive()) {
        return;
    }
    
    if (!isEnabled()) {
        return;
    }
    
    if (buttonType == BUTTONTYPE_BUTTON) {
        pressButton();
        if (pressType == PRESSTYPE_ON_DOWN) {
            if (handler && func) {
                (handler->*func)((CCObject*)this);
            }
        }

    }
}

void Button::touchEnd(CCNode * object)
{
    
    if (Shop::getInstance()->shopIsActive()) {
        return;
    }
    
    if (!isEnabled()) {
        return;
    }
    if (buttonType == BUTTONTYPE_BUTTON) {
        if (pressType == PRESSTYPE_ON_UP_DIRECT) {
            
            if (handler && func) {
                (handler->*func)((CCObject*)this);
            }
        }else{
            releaseButton();    
        }
        
    }
    
    if (buttonType == BUTTONTYPE_CHECK) {
        if (isChecked()) {
            setChecked(false);
        }else{
            setChecked(true);
        }
        
        if (handler && func) {
            (handler->*func)((CCObject*)this);
        }

        
    }
}

void Button::spriteAnimHasEnded(CCObject * object)
{
    //LHSprite * _sprite = (LHSprite*) object;
    if (sprite) {
        if( buttonType == BUTTONTYPE_BUTTON ){
            if (sprite->animationName() == buttonName + "_pressed" && pressType == PRESSTYPE_ON_UP) {
                if (handler && func) {
                    (handler->*func)((CCObject*)this);
                }
            }
            else{
                iddleButton();
            }            
        }
    }
    
    
}

void Button::setPressType( int type )
{
    pressType = type;
}

void Button::setType(int _buttonType)
{
    buttonType = _buttonType;
    setChecked(true);
}

bool Button::isChecked(void)
{
    if (value) {
        return true;
    }
    return false;
}

void Button::setChecked(bool _check)
{
    if (buttonType == BUTTONTYPE_CHECK) {
        if (_check) {
            pressButton();
            value = 1;
        }else{
            iddleButton();

            value = 0;
        }
    }
}

bool Button::isEnabled()
{
    if (!sprite) {
        return false;
    }
    
    if (!sprite->isVisible()) {
        return false;
    }
    return enabled;
}

void Button::setEnabled( bool _enabled )
{
    enabled = _enabled;
    if (!enabled) {
        // disable view
    }
}

void Button::update()
{
    if (buttonType == BUTTONTYPE_CHECK) {
        setChecked(isChecked());
    }
}

///----- BUTTON MANAGER ------

ButtonManager * ButtonManager::buttonManager = NULL;

ButtonManager::ButtonManager()
{
    buttons.clear();
}

ButtonManager::~ButtonManager()
{
    
}
ButtonManager * ButtonManager::getInstance()
{
    if (!buttonManager) {
        buttonManager = new ButtonManager();
    }
    return buttonManager;
}

void ButtonManager::destroyInstance()
{
    if (buttonManager) {
        delete buttonManager;
        buttonManager = NULL;
    }
}

int ButtonManager::addButton(Button * button)
{
    if (button) {
        buttons.push_back(button);
    }
    return buttons.size()-1;
}
void ButtonManager::removeButton(int index)
{
    if (index >= 0 && index < buttons.size()) {
        buttons.erase(buttons.begin() + index);
    }
}

Button * ButtonManager::touchButton( CCPoint touchPos )
{
    Button * touchButton = NULL;
    for (vector<Button *>::iterator It = buttons.begin(); It != buttons.end(); It++) {
        Button * button = *It;
        if (button->sprite->boundingBox().containsPoint(touchPos) && button->isEnabled()) {
            touchButton = button;
            break;
        }
    }
    return touchButton;
}
