#include "Effect.h"


Effect::Effect(void)
{
}


Effect::~Effect(void)
{
}

CCAction *  Effect::Bubble( float tm, float delta, bool forever ){
    CCScaleTo * scale1      = CCScaleTo::create(tm/4, 1.0 + delta , 1.0 - delta);
    CCScaleTo * scaleNormal = CCScaleTo::create(tm/4, 1.0 , 1.0);
    CCScaleTo * scale2      = CCScaleTo::create(tm/4, 1.0 - delta , 1.0 + delta);

    
    CCSequence * action = (CCSequence *)CCSequence::create(scale1,scaleNormal,scale2,scaleNormal,NULL);
    if (forever) {
        return  (CCAction *)CCRepeatForever::create( action );
    }
    return (CCAction *)action;
    
}

CCAction *  Effect::Pulse( float tm, float delta, bool forever ){
    CCScaleTo * scale1      = CCScaleTo::create(tm/4, 1.0 + delta , 1.0 + delta);
    CCScaleTo * scaleNormal = CCScaleTo::create(tm/4, 1.0 , 1.0);
    CCScaleTo * scale2      = CCScaleTo::create(tm/4, 1.0 - delta , 1.0 - delta);
    
    
    CCSequence * action = (CCSequence *)CCSequence::create(scale1,scaleNormal,scale2,scaleNormal,NULL);
    if (forever) {
        return  (CCAction *)CCRepeatForever::create( action );
    }
    return (CCAction *)action;
    
}

CCAction *  Effect::PulseSmall( float tm, float delta, bool forever ){
    CCScaleTo * scaleNormal = CCScaleTo::create(tm/4, 1.0 , 1.0);
    CCScaleTo * scale2      = CCScaleTo::create(tm/4, 1.0 - delta , 1.0 - delta);
    
    
    CCSequence * action = (CCSequence *)CCSequence::create(scale2,scaleNormal,scale2,scaleNormal,NULL);
    if (forever) {
        return  (CCAction *)CCRepeatForever::create( action );
    }
    return (CCAction *)action;
    
}

CCAction * Effect::Zoom( float tm, float zoom ){
    CCScaleTo * scale = CCScaleTo::create(tm, zoom);
    return (CCAction *)scale;
}

CCAction * Effect::Fade( float tm, float trans ){
    CCFadeTo * fade = CCFadeTo::create(tm, trans );
    return (CCAction *)fade;
}

CCAction * Effect::FadeInOut( float tm, float transIn,float transOut ){
     CCSequence * action =  (CCSequence *)CCSequence::create(
                                                             CCFadeTo::create(tm/2, transIn ),
                                                             CCFadeTo::create(tm/2, transOut ),
                                                             NULL);
    return  (CCAction *)CCRepeatForever::create( action );
    
}

CCAction * Effect::alienPreDie( float tm )
{
    CCSequence * action =  (CCSequence *)CCSequence::create(
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),

                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            CCScaleTo::create(tm/16, 1),
                                                            CCScaleTo::create(tm/16, 1.05),
                                                            
                                                            //CCDelayTime::create(tm/4),
                                                            /*CCFadeTo::create(tm/24, 250 ),
                                                            CCFadeTo::create(tm/24, 0 ),
                                                            CCFadeTo::create(tm/24, 250 ),
                                                            CCFadeTo::create(tm/24, 0 ),
                                                            CCFadeTo::create(tm/24, 250 ),
                                                            CCFadeTo::create(tm/24, 0 ),
                                                            CCFadeTo::create(tm/24, 250 ),
                                                            CCFadeTo::create(tm/24, 0 ),
                                                            CCFadeTo::create(tm/24, 250 ),
                                                            CCFadeTo::create(tm/24, 0 ),
                                                            CCFadeTo::create(tm/24, 250 ),
                                                            CCFadeTo::create(tm/24, 0 ),*/
                                                            NULL);
    return  (CCAction *)CCRepeatForever::create( action );
    
}

CCAction * Effect::moonRotate( float tm )
{
    return  (CCAction *)CCRepeatForever::create( CCRotateBy::create(tm, 360) );
}



vector<CCAction *> Effect::pointsFly(CCAction * toEndAction, float delay){

    vector<CCAction *> ret;
	CCDelayTime * delayTime = CCDelayTime::create( delay );
    CCScaleTo * scale1	= CCScaleTo::create( 0.2, 1.7, 1.7 );
    CCScaleTo * scale2	= CCScaleTo::create( 0.2, 0.9, 0.9 );
    CCScaleTo * scale3	= CCScaleTo::create( 0.1, 1.1, 1.1 );
    CCScaleTo * scale4	= CCScaleTo::create( 0.1, 0.95, 0.95 );
    CCScaleTo * scale5	= CCScaleTo::create( 0.2, 1, 1 );
    
	

    ret.push_back(CCSequence::create(
		CCHide::create(),
		CCDelayTime::create( delay ),
		CCShow::create(),
		scale1,
		scale2,
		scale3,
		scale4,
		scale5,
		NULL));

    CCMoveBy *		moveAction		= CCMoveBy::create( 2, ccp( 0, 30 ));
    ret.push_back(CCSequence::create( 
		CCDelayTime::create( delay ), 
		moveAction,toEndAction,
		NULL ));
    CCFadeTo *      fadeAction      = CCFadeTo::create(1.7 + delay, 0 );
    ret.push_back(fadeAction);
    
    return ret;

}

CCAction * Effect::ShakeWorld1(){
    CCMoveTo * shake1 = CCMoveTo::create(0.2,   ccp(0     , 0));
    CCMoveTo * shake2 = CCMoveTo::create(0.2,   ccp(0     , -1));
    CCMoveTo * shake3 = CCMoveTo::create(0.2,   ccp(0     , 1.2));
    CCMoveTo * shake4 = CCMoveTo::create(0.2,   ccp(0     , -2));
    CCMoveTo * shake5 = CCMoveTo::create(0.2,   ccp(0     , 3));
    CCMoveTo * shake6 = CCMoveTo::create(0.2,   ccp(0     , -4.5));
    
    return CCSequence::create(shake6,shake5,shake4,shake3,shake2,shake1,NULL);
}

CCAction * Effect::ShakeWorld2(){
    CCMoveTo * shake1 = CCMoveTo::create(0.2,   ccp(0     , 0));
    CCMoveTo * shake2 = CCMoveTo::create(0.2,   ccp(0     , -1));
    CCMoveTo * shake3 = CCMoveTo::create(0.2,   ccp(0     , 1.2));
    CCMoveTo * shake4 = CCMoveTo::create(0.2,   ccp(0     , -2));
    CCMoveTo * shake5 = CCMoveTo::create(0.2,   ccp(0     , 3));
    CCMoveTo * shake6 = CCMoveTo::create(0.2,   ccp(0     , -4.5));
    CCMoveTo * shake7 = CCMoveTo::create(0.2,   ccp(0     , 6));
    CCMoveTo * shake8 = CCMoveTo::create(0.2,   ccp(0     , -8));
    
    return CCSequence::create(shake8,shake7,shake6,shake5,shake4,shake3,shake2,shake1,NULL);
}

CCAction * Effect::ShakeWorld3(){
    CCMoveTo * shake1 = CCMoveTo::create(0.2,   ccp(0     , 0));
    CCMoveTo * shake2 = CCMoveTo::create(0.2,   ccp(0     , -1));
    CCMoveTo * shake3 = CCMoveTo::create(0.2,   ccp(0     , 1.2));
    CCMoveTo * shake4 = CCMoveTo::create(0.2,   ccp(0     , -2));
    CCMoveTo * shake5 = CCMoveTo::create(0.2,   ccp(0     , 3));
    CCMoveTo * shake6 = CCMoveTo::create(0.2,   ccp(0     , -4.5));
    CCMoveTo * shake7 = CCMoveTo::create(0.2,   ccp(0     , 6));
    CCMoveTo * shake8 = CCMoveTo::create(0.2,   ccp(0     , -8));
    CCMoveTo * shake9 = CCMoveTo::create(0.2,   ccp(0     , 11));
    CCMoveTo * shake10 = CCMoveTo::create(0.2,  ccp(0    , -14));
    
    return CCSequence::create(shake10,shake9,shake8,shake7,shake6,shake5,shake4,shake3,shake2,shake1,NULL);
}

CCAction * Effect::ShakeWorld4(){
    CCMoveTo * shake1 = CCMoveTo::create(0.2,   ccp(0     , 0));
    CCMoveTo * shake2 = CCMoveTo::create(0.2,   ccp(0     , -1));
    CCMoveTo * shake3 = CCMoveTo::create(0.2,   ccp(0     , 1.2));
    CCMoveTo * shake4 = CCMoveTo::create(0.2,   ccp(0     , -2));
    CCMoveTo * shake5 = CCMoveTo::create(0.2,   ccp(0     , 3));
    CCMoveTo * shake6 = CCMoveTo::create(0.2,   ccp(0     , -4.5));
    CCMoveTo * shake7 = CCMoveTo::create(0.2,   ccp(0     , 6));
    CCMoveTo * shake8 = CCMoveTo::create(0.2,   ccp(0     , -8));
    CCMoveTo * shake9 = CCMoveTo::create(0.2,   ccp(0     , 11));
    CCMoveTo * shake10 = CCMoveTo::create(0.2,  ccp(0    , -14));
    
    return CCSequence::create(shake10,shake9,shake10,shake9,shake8,shake7,shake6,shake5,shake4,shake3,shake2,shake1,NULL);
}

CCAction * Effect::ShakeWorld0(){
    CCMoveTo * shake1 = CCMoveTo::create(0.2,   ccp(0     , 0));
    CCMoveTo * shake2 = CCMoveTo::create(0.2,   ccp(0     , -1));
    CCMoveTo * shake3 = CCMoveTo::create(0.2,   ccp(0     , 1.2));
    CCMoveTo * shake4 = CCMoveTo::create(0.2,   ccp(0     , -2));
    
    return CCSequence::create(shake4,shake3,shake2,shake1,NULL);

}

