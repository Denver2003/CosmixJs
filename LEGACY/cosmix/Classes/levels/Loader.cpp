//
//  Loader.cpp
//  boltrix
//
//  Created by Den on 06.05.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#include <iostream>
#include "Loader.h"

Loader * Loader::instance = NULL;

//-------------------------
Loader::Loader(){
}
//-------------------------
Loader::~Loader(){
    saveParams();
}

//-------------------------
Loader * Loader::shared(){
    if (!instance) {
        instance = new Loader();
        instance->loadParams();
        ////////instance->loadLevelNames();
    }
    return instance;
}

void Loader::DestroyInstance(){
    
}
// loadind data params
void Loader::loadParams(){

    cocos2d::CCUserDefault * ud = cocos2d::CCUserDefault::sharedUserDefault();
    
    currentLevel = ud->getStringForKey("currentLevel","level");
}

// loadind data params
void Loader::saveParams(){
    cocos2d::CCUserDefault * ud = cocos2d::CCUserDefault::sharedUserDefault();
    
    ud->setStringForKey( "currentLevel", currentLevel );
    ud->flush();
}

