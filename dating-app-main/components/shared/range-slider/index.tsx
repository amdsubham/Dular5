"use client";
import { createRangeSlider } from "@gluestack-ui/range-slider";
import { Pressable } from "react-native";
import { View } from "react-native";
import React from "react";
import { tva } from "@gluestack-ui/utils/nativewind-utils";
import {
  withStyleContext,
  useStyleContext,
} from "@gluestack-ui/utils/nativewind-utils";
import type { VariantProps } from "@gluestack-ui/utils/nativewind-utils";
import { cssInterop } from "nativewind";

const SCOPE = "RANGE-SLIDER";
const Root = withStyleContext(View, SCOPE);
export const UIRangeSlider = createRangeSlider({
  Root: Root,
  LeftThumb: View,
  RightThumb: View,
  Track: Pressable,
  FilledTrack: View,
  ThumbInteraction: View,
});

cssInterop(UIRangeSlider.Track, { className: "style" });

const sliderStyle = tva({
  base: "justify-center items-center data-[disabled=true]:opacity-40 data-[disabled=true]:web:pointer-events-none",
  variants: {
    orientation: {
      horizontal: "w-full",
      vertical: "h-full",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
    isReversed: {
      true: "",
      false: "",
    },
  },
});

const sliderLeftThumbStyle = tva({
  base: "bg-primary-500 absolute rounded-full data-[focus=true]:bg-primary-600 data-[active=true]:bg-primary-600 data-[hover=true]:bg-primary-600 data-[disabled=true]:bg-primary-500 web:cursor-pointer web:data-[active=true]:outline web:data-[active=true]:outline-4 web:data-[active=true]:outline-primary-400 shadow-hard-1",

  parentVariants: {
    size: {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    },
  },
});
const sliderRightThumbStyle = tva({
  base: "bg-primary-500 absolute rounded-full data-[focus=true]:bg-primary-600 data-[active=true]:bg-primary-600 data-[hover=true]:bg-primary-600 data-[disabled=true]:bg-primary-500 web:cursor-pointer web:data-[active=true]:outline web:data-[active=true]:outline-4 web:data-[active=true]:outline-primary-400 shadow-hard-1",

  parentVariants: {
    size: {
      sm: "h-4 w-4",
      md: "h-5 w-5",
      lg: "h-6 w-6",
    },
  },
});

const sliderTrackStyle = tva({
  base: "bg-background-300 rounded-lg overflow-hidden",
  parentVariants: {
    orientation: {
      horizontal: "w-full",
      vertical: "h-full",
    },
    isReversed: {
      true: "",
      false: "",
    },
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  parentCompoundVariants: [
    {
      orientation: "horizontal",
      size: "sm",
      class: "h-1 flex-row",
    },
    {
      orientation: "horizontal",
      size: "sm",
      isReversed: true,
      class: "h-1 flex-row-reverse",
    },
    {
      orientation: "horizontal",
      size: "md",
      class: "h-1 flex-row",
    },
    {
      orientation: "horizontal",
      size: "md",
      isReversed: true,
      class: "h-[5px] flex-row-reverse",
    },
    {
      orientation: "horizontal",
      size: "lg",
      class: "h-1.5 flex-row",
    },
    {
      orientation: "horizontal",
      size: "lg",
      isReversed: true,
      class: "h-1.5 flex-row-reverse",
    },
    {
      orientation: "vertical",
      size: "sm",
      class: "w-1 flex-col-reverse",
    },
    {
      orientation: "vertical",
      size: "sm",
      isReversed: true,
      class: "w-1 flex-col",
    },
    {
      orientation: "vertical",
      size: "md",
      class: "w-[5px] flex-col-reverse",
    },
    {
      orientation: "vertical",
      size: "md",
      isReversed: true,
      class: "w-[5px] flex-col",
    },
    {
      orientation: "vertical",
      size: "lg",
      class: "w-1.5 flex-col-reverse",
    },
    {
      orientation: "vertical",
      size: "lg",
      isReversed: true,
      class: "w-1.5 flex-col",
    },
  ],
});

const sliderFilledTrackStyle = tva({
  base: "bg-primary-500 data-[focus=true]:bg-primary-600 data-[active=true]:bg-primary-600 data-[hover=true]:bg-primary-600",
  parentVariants: {
    orientation: {
      horizontal: "h-full",
      vertical: "w-full",
    },
  },
});

type ISliderProps = React.ComponentProps<typeof UIRangeSlider> &
  VariantProps<typeof sliderStyle>;

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof UIRangeSlider>,
  ISliderProps
>(
  (
    {
      className,
      size = "md",
      orientation = "horizontal",
      isReversed = false,
      ...props
    },
    ref
  ) => {
    return (
      <UIRangeSlider
        ref={ref}
        isReversed={isReversed}
        orientation={orientation}
        {...props}
        className={sliderStyle({
          orientation,
          isReversed,
          class: className,
        })}
        context={{ size, orientation, isReversed }}
      />
    );
  }
);

type ISliderLeftThumbProps = React.ComponentProps<
  typeof UIRangeSlider.LeftThumb
> &
  VariantProps<typeof sliderLeftThumbStyle>;

const RangeSliderLeftThumb = React.forwardRef<
  React.ElementRef<typeof UIRangeSlider.LeftThumb>,
  ISliderLeftThumbProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIRangeSlider.LeftThumb
      // @ts-ignore
      ref={ref}
      {...props}
      className={sliderLeftThumbStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
    />
  );
});

type ISliderRightThumbProps = React.ComponentProps<
  typeof UIRangeSlider.RightThumb
> &
  VariantProps<typeof sliderRightThumbStyle>;

const RangeSliderRightThumb = React.forwardRef<
  React.ElementRef<typeof UIRangeSlider.RightThumb>,
  ISliderRightThumbProps
>(({ className, size, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIRangeSlider.RightThumb
      // @ts-ignore
      ref={ref}
      {...props}
      className={sliderRightThumbStyle({
        parentVariants: {
          size: parentSize,
        },
        size,
        class: className,
      })}
    />
  );
});

type ISliderTrackProps = React.ComponentProps<typeof UIRangeSlider.Track> &
  VariantProps<typeof sliderTrackStyle>;

const RangeSliderTrack = React.forwardRef<
  React.ElementRef<typeof UIRangeSlider.Track>,
  ISliderTrackProps
>(({ className, ...props }, ref) => {
  const {
    orientation: parentOrientation,
    size: parentSize,
    isReversed,
  } = useStyleContext(SCOPE);

  return (
    <UIRangeSlider.Track
      ref={ref}
      {...props}
      className={sliderTrackStyle({
        parentVariants: {
          orientation: parentOrientation,
          size: parentSize,
          isReversed,
        },
        class: className,
      })}
    />
  );
});

type ISliderFilledTrackProps = React.ComponentProps<
  typeof UIRangeSlider.FilledTrack
> &
  VariantProps<typeof sliderFilledTrackStyle>;

const RangeSliderFilledTrack = React.forwardRef<
  React.ElementRef<typeof UIRangeSlider.FilledTrack>,
  ISliderFilledTrackProps
>(({ className, ...props }, ref) => {
  const { orientation: parentOrientation } = useStyleContext(SCOPE);

  return (
    <UIRangeSlider.FilledTrack
      // @ts-ignore
      ref={ref}
      {...props}
      className={sliderFilledTrackStyle({
        parentVariants: {
          orientation: parentOrientation,
        },
        class: className,
      })}
    />
  );
});

export {
  RangeSlider,
  RangeSliderLeftThumb,
  RangeSliderRightThumb,
  RangeSliderTrack,
  RangeSliderFilledTrack,
};
