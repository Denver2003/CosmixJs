//
//  HelloWorldScene.h
//  cosmix
//
//  Created by Den on 30.10.12.
//  Copyright __MyCompanyName__ 2012. All rights reserved.
//
#ifndef __HELLO_WORLD_H__
#define __HELLO_WORLD_H__

// When you import this file, you import all the cocos2d classes
#include "cocos2d.h"
#include "Box2D.h"
#include "LevelHelperLoader.h"

class HelloWorld : public cocos2d::CCLayer {
public:
    ~HelloWorld();
    HelloWorld();
    
    // returns a Scene that contains the HelloWorld as the only child
    static cocos2d::CCScene* scene();
    
    void initPhysics();

    virtual void draw();
    void update(float dt);
    
    virtual void ccTouchesBegan	(cocos2d::CCSet* touches, cocos2d::CCEvent* event);

    
private:
    b2World* world;
    cocos2d::CCTexture2D* m_pSpriteTexture; // weak ref
    LevelHelperLoader * loader;
	CCLayer * camera;
    
};

#endif // __HELLO_WORLD_H__
