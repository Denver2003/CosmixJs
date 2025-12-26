//
//  sounds.h
//  cosmix
//
//  Created by denver on 06.05.13.
//
//

#ifndef __cosmix__sounds__
#define __cosmix__sounds__

#include <iostream>
#include "cocos2d.h"
#include "SimpleAudioEngine.h" 

using namespace std;
USING_NS_CC;

class sound : public CCObject
{
protected:
    sound();
    ~sound();
    static sound * instance;
public:
    static sound * getInstance();
    static void destroyInstance();
    
    void initSounds();
    
    unsigned int playSound(string filename);

    unsigned int playRandomSound(string group);
    unsigned int playFirstSound(string group);
    void addSoundToGroup(string group, string fileName,int addCount=1);
    vector<string> getSoundGroup(string group);
    map<string, vector<string> > groupSoundFiles;
    
    void stopSound(unsigned int sound);


};

#endif /* defined(__cosmix__sounds__) */
