//
//  CosmoMeter.h
//  cosmix
//
//  Created by denver on 30.09.13.
//
//

#ifndef __cosmix__CosmoMeter__
#define __cosmix__CosmoMeter__

//#define COSMOMETER_MAXSCALE 100
//#define COSMOMETER_MINSCALE 0

#include "LevelHelperLoader.h"


USING_NS_CC;

class CosmoMeter : public CCObject
{
public:
    int level;  //реальная величина
    int spriteLevel; // величина для спрайтов, плавно изменяющаяся(для анимации)
    int multiplier;
    float freqToDown; //скорость падения шкалы в секунду
    float curfreqToDown;

    float freqForAnimation; //скорость движения шкалы(анимация)
    float curFreqForAnimation;
    
    std::vector<LHSprite *> scales;
    std::vector<LHSprite *> lamps;
    
    int level2xIndexFrom;
    int level3xIndexFrom;
    int level5xIndexFrom;
    int level2xIndexTo;
    int level3xIndexTo;
    int level5xIndexTo;
    bool is2x;
    bool is3x;
    bool is5x;
    float coef2x;
    float coef3x;
    float coef5x;
    bool isMax;
    
    int frame;
    
    float shiftY;
    CCPoint topPosition;
    CCPoint bottomPosition;
    float deltaScaleY;
    int maxScale;
    
    int spriteIndexByLevel(int _level);
    
    void loadFromLevel(LevelHelperLoader * loader);

    void updateSprites(float dt);
    void update(float dt);
    void updateFrame();
    
    void moveUp(int _points);
    void moveDown(int _points);
    void setLevel(int _newLevel);
    void flyLabel(int multi);
    void endOfFlyLabel(CCNode * node);
    
    int getMultiplier(void);
    
    void reOrder(void);
    void startGame(void);
    
    //static methods
    static CosmoMeter * getInstance();
    static void destroyInstance();
    
    static CosmoMeter * instance;
    
protected:
    CosmoMeter();
    ~CosmoMeter();
};

#endif /* defined(__cosmix__CosmoMeter__) */
