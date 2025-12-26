//
//  popupMenu.h
//  cosmix
//
//  Created by denver on 03.04.13.
//
//

#ifndef __cosmix__popupMenu__
#define __cosmix__popupMenu__

#include "LevelHelperLoader.h"
#include "button.h"

#define SHOWTYPE_FAST 0
#define SHOWTYPE_MOVING 1
#define SHOWTYPE_FADING 2

struct menuElement {
    
    int         showType;
    string      spriteName;
    //LHSprite *  sprite;
    CCNode   *  sprite;
    CCLabelBMFont *  label;
    CCPoint     startPoint;
    CCPoint     endPoint;
    float       delay;
    float       delayHide;
    Button *    button = NULL;
    string      name;
    bool        isVisible;
};

class PopupMenu : public CCObject {
public:
    PopupMenu( string FileName, bool isSubMenu=false );
    ~PopupMenu();
    int addSpriteName(string spriteName,float delay = 0, Button * button = NULL);
    void showMenu(float time);
    void hideMenu(float time);
    
    void endOfHide(CCNode * node);
    void endOfShow(CCNode * node);
    
    void setOnShowFunc(CCObject * handler, SEL_CallFuncO func);
    void setOnHideFunc(CCObject * handler, SEL_CallFuncO func);

    void setOnEndShowFunc(CCObject * handler, SEL_CallFuncO func);
    void setOnEndHideFunc(CCObject * handler, SEL_CallFuncO func);
    
    bool setLabelText(string labelName, string text);
    
    LevelHelperLoader * getLoader();
    
    Button * getButtonByName(string buttonName);
    CCLabelBMFont * getLabelByName(string buttonName);

    menuElement * getElementByName(string _Name);
    
public:
    string lhFileName;
    vector<menuElement *> elements;
    
    LevelHelperLoader * LHLoader;
    bool    isShowing;
    SEL_CallFuncO onShowFunc;
    CCObject * onShowHandler;
    SEL_CallFuncO onHideFunc;
    CCObject * onHideHandler;

    SEL_CallFuncO onEndShowFunc;
    CCObject * onEndShowHandler;
    SEL_CallFuncO onEndHideFunc;
    CCObject * onEndHideHandler;

    
    
};


#endif /* defined(__cosmix__popupMenu__) */
