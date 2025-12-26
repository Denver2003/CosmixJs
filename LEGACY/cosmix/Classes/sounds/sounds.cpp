//
//  sounds.cpp
//  cosmix
//
//  Created by denver on 06.05.13.
//
//

#include "sounds.h"
#include "params.h"

sound * sound::instance = NULL;


sound::sound()
{
    
}

sound::~sound()
{
    
}

sound * sound::getInstance()
{
    if (!sound::instance) {
        sound::instance = new sound();
        sound::instance->initSounds();
        
        //CocosDenshion::SimpleAudioEngine::sharedEngine()->
    }
    return sound::instance;
}

void sound::destroyInstance()
{
    if (!sound::instance) {
        delete sound::instance;
        sound::instance = NULL;
    }
    
}
void sound::initSounds()
{
    addSoundToGroup("bubble_bang", "bubble_bang.mp3");
    
    addSoundToGroup("bubble_create", "bubble_create.mp3");
    
    addSoundToGroup("figure_bang", "figure_bang1.mp3");
    addSoundToGroup("figure_bang", "figure_bang2.mp3");
    //addSoundToGroup("figure_bang", "figure_bang3.mp3");
    
    addSoundToGroup("figure_create", "figure_create.mp3");
    
    addSoundToGroup("figure_end_fall", "figure_end_fall1.mp3");
    addSoundToGroup("figure_end_fall", "figure_end_fall2.mp3");
    addSoundToGroup("figure_end_fall", "figure_end_fall3.mp3");
    
    addSoundToGroup("last_chance", "last_chance.mp3");
    
    addSoundToGroup("lightning_short", "lightning1.mp3",3);
    addSoundToGroup("lightning_short", "lightning_mix.mp3");
    
    addSoundToGroup("lightning_medium", "lightning2.mp3",3);
    addSoundToGroup("lightning_medium", "lightning_mix.mp3");
    
    addSoundToGroup("lightning_long", "lightning3.mp3",3);
    addSoundToGroup("lightning_long", "lightning_mix.mp3");
    
    addSoundToGroup("combo", "combo.mp3");
    addSoundToGroup("super_combo", "super_combo.mp3");
    addSoundToGroup("mega_combo", "mega_combo.mp3");
    addSoundToGroup("cosmo_combo", "cosmo_combo.mp3");
    
    addSoundToGroup("touch_to_kill", "touch_to_kill.mp3");
    addSoundToGroup("cosmogun", "cosmogun.mp3");
    
    addSoundToGroup("cosmometer_2x", "cosmometer_2x.mp3");
    addSoundToGroup("cosmometer_3x", "cosmometer_3x.mp3");
    addSoundToGroup("cosmometer_5x", "cosmometer_5x.mp3");
    
    addSoundToGroup("coin_pick_up", "coin_pick_up.mp3");
    addSoundToGroup("new_level", "new_level.mp3");
    
    addSoundToGroup("fall_figures", "fall_figures.mp3");
    
    addSoundToGroup("grenade", "grenade1.mp3");
    addSoundToGroup("grenade", "grenade2.mp3");
    
    
    
}

unsigned int sound::playSound(string filename)
{
    if (params::getInstance()->soundOn > 0) {
        return CocosDenshion::SimpleAudioEngine::sharedEngine()->playEffect(filename.c_str());
    }
    return 0;
}

unsigned int sound::playRandomSound(string group)
{
    vector<string> sounds = getSoundGroup(group);
    unsigned int count = sounds.size();
    if (count > 0) {
        int index = CCRANDOM_0_1()*count;
        if (index>=0 && index<count) {
            return playSound(sounds[index]);
        }
    }
    return 0;
}
unsigned int sound::playFirstSound(string group)
{
    vector<string> sounds = getSoundGroup(group);
    unsigned int count = sounds.size();
    if (count > 0) {
        return playSound(sounds[0]);
    }
    return 0;
}

void sound::addSoundToGroup(string group, string fileName, int addCount)
{
    if (group == "" || fileName == "") {
        return;
    }

    // встроить проверку на существование файла
    //string fullPath = CCFileUtils::sharedFileUtils()->fullPathFromRelativePath(fileName.c_str());
    
    map<string, vector<string> >::iterator It =  groupSoundFiles.find(group);
    
    CocosDenshion::SimpleAudioEngine::sharedEngine()->preloadEffect(fileName.c_str());
    if (It == groupSoundFiles.end()) {
        vector<string> sounds;
        for (int i=0; i<addCount; i++) {
            sounds.push_back(fileName);
        }
        groupSoundFiles.insert(make_pair(group,sounds));
    }else{
        vector<string> sounds = It->second;
        for (int i=0; i<addCount; i++) {
            sounds.push_back(fileName);
        }
    }
}

vector<string> sound::getSoundGroup(string group)
{
    vector<string> sounds;
    map<string, vector<string> >::iterator It =  groupSoundFiles.find(group);
    if (It == groupSoundFiles.end()) {
    }else{
        sounds = It->second;
    }
    return sounds;
}

void sound::stopSound(unsigned int sound)
{
    CocosDenshion::SimpleAudioEngine::sharedEngine()->stopEffect(sound);
}

