#ifndef boltrix_Effect_h
#define boltrix_Effect_h

#include "cocos2d.h"

using namespace cocos2d;
using namespace std;
/// cocos visual effects
class Effect
{
public:
	Effect(void);
	~Effect(void);
    
    static CCAction * Bubble( float tm, float delta, bool forever = false );
    static CCAction * Pulse( float tm, float delta, bool forever = false );
    static CCAction * PulseSmall( float tm, float delta, bool forever = false );
    
    static CCAction * Zoom( float tm, float zoom );    
    static CCAction * Fade( float tm, float trans );
    
    static CCAction * FadeInOut( float tm, float transIn,float transOut);

    static CCAction * alienPreDie( float tm);
    static CCAction * moonRotate( float tm );
    
    

    static vector<CCAction*> pointsFly(CCAction * toEndAction, float delay = 0);

    static CCAction * ShakeWorld0();    
    static CCAction * ShakeWorld1();    
    static CCAction * ShakeWorld2();    
    static CCAction * ShakeWorld3();    
    static CCAction * ShakeWorld4();    
    
    

};

#endif