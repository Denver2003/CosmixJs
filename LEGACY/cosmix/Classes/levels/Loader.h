//
//  Loader.h
//  boltrix
//
//  Created by Den on 06.05.12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#ifndef boltrix_Loader_h
#define boltrix_Loader_h

#include "cocos2d.h"
using namespace cocos2d;
using namespace std;

class Loader {
public:
    
    static Loader * shared();
    static void DestroyInstance();


    
private:
    static Loader * instance;
    
    Loader();
    ~Loader();
    
    void loadParams();
    void saveParams();
    

    
public:
    /// global params
    string currentLevel;
    
    
    
    
    
    
    
    
};


#endif
