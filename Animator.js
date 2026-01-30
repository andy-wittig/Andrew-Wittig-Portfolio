import MathHelper from "./MathHelper.js";

export default class Animator
{
    constructor()
    {
        //Camera Animation
        this.animCameraStepRotation = 0;
        this.animCameraStepPosition = [0, 0, 0];
        this.animCameraStepRadius = 0;

        this.animCameraStartRotation = 0;
        this.animCameraStartPosition = [0, 0, 0];
        this.animCameraStartRadius = 0;

        this.startCameraAnim = false;
        this.animCameraProgress = 0;

        //Clipboard Animation
        this.clipboardStartingPos = [0, 1.02, 2.05];
        this.clipboardSlideLeftPos = [-4, 1.02, 2.05];
        this.clipboardSlideRightPos = [4, 1.02, 2.05];
        this.clipboardAnimProgress = 0;
        this.startClipboardAnim = false;
        this.flipSlide = false;
        this.slideIn = false;
    }

    StartCameraAnimation(rotation = this.animCameraStepRotation, position = this.animCameraStepPosition, radius = this.animCameraStepRadius)
    {
        this.startCameraAnim = true;
        this.animCameraStartRotation = rotation;
        this.animCameraStartPosition = position;
        this.animCameraStartRadius = radius;
        this.animCameraProgress = 0;
    }

    CameraAnimate(time, degree, position, radius)
    {
        let animDuration = 3;
        this.animCameraProgress += time / animDuration;
        this.animCameraProgress = Math.min( this.animCameraProgress, 1);
        let easedProgress = MathHelper.EaseInThenOut( this.animCameraProgress);

        this.animCameraStepRotation    = this.animCameraStartRotation + (degree - this.animCameraStartRotation) * easedProgress;
        this.animCameraStepRadius      = this.animCameraStartRadius + (radius - this.animCameraStartRadius) * easedProgress;
        this.animCameraStepPosition[0] = this.animCameraStartPosition[0] + (position[0] - this.animCameraStartPosition[0]) * easedProgress;
        this.animCameraStepPosition[1] = this.animCameraStartPosition[1] + (position[1] - this.animCameraStartPosition[1]) * easedProgress;
        this.animCameraStepPosition[2] = this.animCameraStartPosition[2] + (position[2] - this.animCameraStartPosition[2]) * easedProgress;

        let cameraView = [[0, 0, 0], [0, 0, 0], [0, 1, 0]];
        cameraView[0][0] = this.animCameraStepRadius * Math.sin(MathHelper.DegToRad(this.animCameraStepRotation));
        cameraView[0][1] = 1.5;
        cameraView[0][2] = this.animCameraStepRadius * Math.cos(MathHelper.DegToRad(this.animCameraStepRotation));
        cameraView[1][0] = this.animCameraStepPosition[0];
        cameraView[1][1] = this.animCameraStepPosition[1];
        cameraView[1][2] = this.animCameraStepPosition[2];

        if ( this.animCameraProgress == 1) { this.startCameraAnim = false; }
        return cameraView;
    }

    StartClipboardAnimation(slideIn)
    {
        this.clipboardAnimProgress = 0;
        this.startClipboardAnim = true;
        this.slideIn = slideIn; //When false, the clipboard slides to the left.
        this.flipSlide = false;
    }

    ClipboardAnimate(time, callback)
    {
        let startPos, endPos;

        if (!this.slideIn && !this.flipSlide) //Left button clicked
        {
            startPos = this.clipboardStartingPos;
            endPos = this.clipboardSlideLeftPos;
        }
        else if (!this.slideIn && this.flipSlide)
        {
            startPos = this.clipboardSlideRightPos;
            endPos = this.clipboardStartingPos;
        }
        else if (this.slideIn && !this.flipSlide) //Right button
        {
            startPos = this.clipboardStartingPos;
            endPos = this.clipboardSlideRightPos;
        }
        else
        {
            startPos = this.clipboardSlideLeftPos;
            endPos = this.clipboardStartingPos;
        }

        const animDuration = 2.6;
        this.clipboardAnimProgress += time / animDuration;
        this.clipboardAnimProgress = Math.min(this.clipboardAnimProgress, 1);
        let easedProgress = MathHelper.EaseInThenOut(this.clipboardAnimProgress);

        const animX = startPos[0] + (endPos[0] - startPos[0]) * easedProgress;
        const animY = startPos[1] + (endPos[1] - startPos[1]) * easedProgress;
        const animZ = startPos[2] + (endPos[2] - startPos[2]) * easedProgress;

        if (this.clipboardAnimProgress >= 0.5 && !this.flipSlide) //Halfway point
        {
            this.flipSlide = true;
            callback();
        }

        if (this.clipboardAnimProgress == 1) 
        { 
            this.startClipboardAnim = false; 
        }

        return [animX, animY, animZ];
    }
}