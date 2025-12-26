//
//  boom.h
//  cosmix
//
//  Created by Den on 02.12.12.
//
//

#ifndef __cosmix__boom__
#define __cosmix__boom__

#include "Alien.h"
class CBoomSprite : public CCObject
{
public:
    CBoomSprite( Alien * alien );
    ~CBoomSprite();
    void initWithAlien( Alien * alien );
    void spriteAnimHasEnded(CCObject * object);

    
    LHSprite * dieSprite;
};

#endif /* defined(__cosmix__boom__) */
