-- Add UPDATE policy for messages so users can mark their own messages as read
CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Add UPDATE and DELETE policies for buy_requests so users can edit/cancel their requests
CREATE POLICY "Users can update their own buy requests"
ON public.buy_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own buy requests"
ON public.buy_requests
FOR DELETE
USING (auth.uid() = user_id);

-- Add UPDATE and DELETE policies for sell_requests so users can edit/cancel their requests
CREATE POLICY "Users can update their own sell requests"
ON public.sell_requests
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sell requests"
ON public.sell_requests
FOR DELETE
USING (auth.uid() = user_id);