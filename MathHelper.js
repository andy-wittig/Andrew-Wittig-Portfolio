export default class MathHelper
{
    static EaseInThenOut(t)
    {
        if (t <= 0.5)
        {
            return 2.0 * t * t;
        }
        t -= 0.5;
        return 2.0 * t * (1.0 - t) + 0.5;
    }

    static DegToRad(degrees)
    {
        return (degrees * Math.PI) / 180.0;
    }

    static RadToDeg(rads)
    {
        return rads * (180.0 / Math.PI);
    }
}