//
//  LoadingScene.h
//  boltrix
//
//  Created by Den on 19.09.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_LoadingScene_h
#define boltrix_LoadingScene_h

#include "game.h"



class LoadingScene : public cocos2d::CCLayer {
public:
    LoadingScene();
    ~LoadingScene();
    
    // returns a Scene that contains the HelloWorld as the only child
    static cocos2d::CCScene* scene();
    
    void tick(float dt);

    
    LevelHelperLoader * gameSceneLoader;
    LHSprite *          loadingSprite;
    b2World*            world;
    
    void loadingProgress(float progressValue);

    
};

#endif
