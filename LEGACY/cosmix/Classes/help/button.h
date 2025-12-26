//
//  button.h
//  cosmix
//
//  Created by denver on 23.12.12.
//
//

#ifndef __cosmix__button__
#define __cosmix__button__

#include "LevelHelperLoader.h"

#define PRESSTYPE_ON_UP 0
#define PRESSTYPE_ON_DOWN 1
#define PRESSTYPE_ON_UP_DIRECT 2

#define BUTTONTYPE_BUTTON 0
#define BUTTONTYPE_CHECK 1


class Button : public CCObject
{
protected:
    LevelHelperLoader * loader;
    
public:
    Button(
           string _spriteName,
           string _buttonName,
           string _sceneName,
           CCObject * _handler = NULL,
           SEL_CallFuncO _func = NULL,
           LevelHelperLoader *_loader = NULL);
    
    
    ~Button();
    
    void setActionFunction(CCObject * _handler,SEL_CallFuncO _func);
    void pressButton();
    void releaseButton();
    void iddleButton();
    
    void touchBegin(CCNode * object);
    void touchEnd(CCNode * object);
    void spriteAnimHasEnded(CCObject * object);
    void setPressType( int type );
    void setType(int _buttonType);
    bool isChecked(void);
    void setChecked(bool _check);
    
    bool isEnabled();
    void setEnabled( bool _enabled );
    
    void update();
    /// idle down pressed
    
    string buttonName;
    string sceneName;
    string spriteName;
    LHSprite * sprite;
    SEL_CallFuncO func;
    CCObject * handler;
    int pressType;
    CCRect touchRect;
    int buttonIndex;
    int buttonType;
    int value;
    bool enabled;
};

class ButtonManager
{
protected:
    ButtonManager();
    ~ButtonManager();
    
    static ButtonManager * buttonManager ;
    
public:
    static ButtonManager * getInstance();
    static void destroyInstance();

    vector<Button*> buttons;
    int addButton(Button * button);
    void removeButton(int index);

    Button * touchButton( CCPoint touchPos );
};
#endif /* defined(__cosmix__button__) */
