from tkinter import *
from colorsys import *

def rgb2hex(r,g,b):
    s = f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"
    #print(s)
    return s

def rgb2grey(r,g,b):
    return r*0.2989 + g*0.5870 + b*0.1140

master = Tk()
w = Canvas(master, width=2000, height=1500, background="black")
w.pack()

startfarbe_hsv = (0.04, 1, 1)

c_rgb = hsv_to_rgb(*startfarbe_hsv)

w.create_rectangle(10,10,100,50, fill=rgb2hex(*c_rgb))

grey_target = rgb2grey(*c_rgb)
grey_target = .5
print(f"grey_target: {grey_target}")

rectx = 110
rectw = 50    # rectangle width

print("var project_colours = [")

for hue_target_percent in range(0, 100, 10):
    h_target = (startfarbe_hsv[0] + hue_target_percent / 100) % 1.0
    #print(f"target hue: {h_target}")
    recty = 0

    # now cycle through all "s" and find the "h" that results in
    # the greyscale value being within 0.1% of the greyscale value
    # of the original color.
    s=0
    while s<=1:
        v = 0
        while v<=1:
            rgb = hsv_to_rgb(h_target, s, v)
            grey = rgb2grey(*rgb)
            if abs(grey-grey_target)<0.001:
                #print(f"success: {h_target}, {s}, {v} -> {grey}")
                #w.create_rectangle(10,10+recty*60,100,50+recty*60, fill=rgb2hex(*c_rgb))
                w.create_rectangle(rectx,10+recty*60,rectx+rectw,50+recty*60, fill=rgb2hex(*rgb))
                recty += 1
                if abs(s-.60)<.00001:
                    print(f'    "{rgb2hex(*rgb)}",   /* hue={h_target:.2f}, s={s:.2f}, v={v:.2f} */')
                break
            v = v+.001
        s = s+0.05

    rectx = rectx + rectw + 20
    
print("];")
