//
//  HelloWorldScene.h
//  Boltrix
//
//  Created by Den on 16.03.12.
//  Copyright __MyCompanyName__ 2012. All rights reserved.
//
#ifndef __HELLO_WORLD_H__
#define __HELLO_WORLD_H__

// When you import this file, you import all the cocos2d classes
#include "cocos2d.h"
#include "Box2D.h"

class HelloWorld : public cocos2d::CCLayer {
public:
    ~HelloWorld();
    HelloWorld();
    
    // returns a Scene that contains the HelloWorld as the only child
    static cocos2d::CCScene* scene();
    void tick(float dt);
};

#endif // __HELLO_WORLD_H__
